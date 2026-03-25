import QRCode from 'qrcode';
import { ApiError } from '../utils/ApiError.js';
import { uploadFilePathToS3 } from './upload.functions.js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import logger from '../utils/Logger.js';
if (!ffmpegPath) {
  logger.error('FFmpeg binary not found. Please ensure ffmpeg-static is installed correctly.');
  throw new ApiError('FFmpeg binary not found');
}
ffmpeg.setFfmpegPath(ffmpegPath.toString());

export const getGenderStringFromCode = (code: string) => {
  switch (code) {
    case 'M':
      return 'Male';
    case 'F':
      return 'Female';
    case 'O':
      return 'Other';
    default:
      return 'Unknown';
  }
};

export const isMobileNumber = (mobileNumber: string): boolean => {
  const mobileNumberPattern = /^[6-9]\d{9}$/;
  return mobileNumberPattern.test(mobileNumber);
};

export const isEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export const generateQrCode = async (data: string): Promise<string> => {
  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = 'qrcode' + '-' + uniqueSuffix + '.png';
    const pathToFile = `./public/tmp/${filename}`;
    await QRCode.toFile(pathToFile, data);
    const url = await uploadFilePathToS3(
      pathToFile,
      filename,
      { tag: 'QRCode' },
      'bandhucare_test',
      true,
    );
    return url;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    throw new ApiError('Failed to generate QR code');
  }
};

export const base64ToFile = (
  base64Data: string,
  outputDir: string = './public/tmp',
  fileName?: string,
  preferredMimeType?: string,
): string => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const matches = base64Data.match(/^data:(.+);base64,(.*)$/);
  const detectedMimeType =
    matches && matches[1] ? matches[1] : 'application/octet-stream';
  const mimeType = preferredMimeType || detectedMimeType;
  const data = matches && matches[2] ? matches[2] : base64Data;
  const buffer = Buffer.from(data, 'base64');
  const extension = mime.extension(mimeType) || 'bin';
  const safeFileName =
    fileName ||
    `file-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const filePath = path.join(outputDir, safeFileName);
  fs.writeFileSync(filePath, buffer);

  return filePath;
};

export const convertToWav = (
  inputPath: string,
  outputPath: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    logger.info(`Input Path For Wave Conversion: ${inputPath}`);
    ffmpeg()
      .input(inputPath)
      .inputOptions([
        '-f s16le',
        '-ar 44100',
        '-ac 1',
      ])
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('end', () => {
        logger.info(`Output Path For Wave Conversion: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('FFmpeg error:', err);
        reject(err);
      })
      .save(outputPath);
  });
};

export const deleteFile = (filePath: string) => {
  fs.unlinkSync(filePath);
};

export const localize = (obj: any, lang: string) => {
  if (!obj || typeof obj !== 'object') return obj;

  return (
    obj[lang] ||
    obj['en_us'] ||
    Object.values(obj)[0] ||
    null
  );
};

export interface TimeSlot {
  value: string;
  label: string;
}

export const generateTimeSlots = (
  start: string = '09:00',
  end: string = '18:00',
  intervalMinutes: number = 30,
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const parseTime = (str: string): [number, number] => {
    const parts = str.split(':');

    if (parts.length !== 2) {
      throw new Error(`Invalid time format: ${str}`);
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (isNaN(hour) || isNaN(minute)) {
      throw new Error(`Invalid time format: ${str}`);
    }

    return [hour, minute];
  };

  const to12HourFormat = (h: number, m: number): string => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minuteStr = m.toString().padStart(2, '0');
    return `${hour12}:${minuteStr} ${suffix}`;
  };

  let [h, m] = parseTime(start);
  const [endH, endM] = parseTime(end);

  while (h < endH || (h === endH && m < endM)) {
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = to12HourFormat(h, m);

    slots.push({ value, label });

    m += intervalMinutes;
    if (m >= 60) {
      h++;
      m -= 60;
    }
  }

  return slots;
};

export const convertTo12Hour = (time24: string): string => {
  const [hourStr, minuteStr] = time24.split(':');
  let hour = Number(hourStr);
  const minutes = minuteStr;

  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // 0 → 12

  return `${hour}:${minutes} ${ampm}`;
};

export const convertTo24Hour = (time12h: string): string => {
  if (!time12h || typeof time12h !== 'string') {
    throw new Error('Invalid time format');
  }

  const parts = time12h.trim().split(' ');
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time12h}`);
  }

  const [timePart, modifier] = parts;
  if (!timePart || !modifier) {
    throw new Error(`Invalid time format: ${time12h}`);
  }
  if (modifier !== 'AM' && modifier !== 'PM') {
    throw new Error(`Invalid AM/PM modifier: ${modifier}`);
  }

  const hm = timePart.split(':');
  if (hm.length !== 2) {
    throw new Error(`Invalid time value: ${timePart}`);
  }

  let hours = Number(hm[0]);
  const minutes = Number(hm[1]);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid numeric time value: ${time12h}`);
  }
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) throw ApiError.badRequest("Incorrect Email Format")
  if (name.length <= 2) {
    return name[0] + "*@" + domain;
  }
  return (
    name[0] +
    "*".repeat(name.length - 2) +
    name[name.length - 1] +
    "@" +
    domain
  );
}

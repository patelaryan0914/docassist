"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile, uploadMedia } from "@/lib/axios"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { updateUserStore } from "@/store/authSlice"
import { userInitials } from "@/lib/utils"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address").or(z.literal("")),
})

export function ProfileForm() {
  const dispatch = useAppDispatch()
  const { userInfo } = useAppSelector((state) => state.auth)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [photo, setPhoto] = React.useState(userInfo.photo ?? "")
  const [isUploading, setIsUploading] = React.useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: userInfo.name ?? "",
      email: userInfo.email ?? "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      updateProfile({
        name: values.name,
        ...(values.email ? { email: values.email } : {}),
        photo,
      }),
    onSuccess: (res) => {
      const details = res.data?.data?.userDetails
      if (details) {
        dispatch(
          updateUserStore({
            name: details.name,
            email: details.email ?? details.mobileNumber ?? "",
            photo: details.photo ?? "",
          })
        )
      }
      toast.success(res.data?.message ?? "Profile updated")
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? "Could not update profile")
      }
    },
  })

  const onPickPhoto = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image")
      return
    }
    setIsUploading(true)
    try {
      const uploaded = await uploadMedia(file)
      setPhoto(uploaded.url)
      toast.success("Photo uploaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }, [])

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="mx-auto w-full max-w-md"
    >
      <FieldGroup className="gap-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer"
            aria-label="Change photo"
          >
            <Avatar size="lg" className="size-20">
              <AvatarImage src={photo} alt={userInfo.name} />
              <AvatarFallback className="text-base">
                {userInitials(userInfo.name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {isUploading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </span>
          </button>
          <p className="text-xs text-muted-foreground">Click to change photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickPhoto}
          />
        </div>

        <Field data-invalid={!!form.formState.errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            placeholder="Your name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>

        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Button
          type="submit"
          disabled={mutation.isPending || isUploading}
          className="h-10 w-full rounded-full shadow-md shadow-primary/20"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </FieldGroup>
    </form>
  )
}

"use client"

import { GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { signIn } from "@/lib/axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { signInStore } from "@/store/authSlice"
import { useAppDispatch } from "@/store/hooks"

const signInSchema = z.object({
  email_number: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email_number: "",
      password: "",
    },
  })

  const signInMutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) => {
      return signIn(values.email_number, values.password)
    },
    onSuccess: (res) => {
      if (res.status == 201) {
        localStorage.setItem("accessToken", res.data.data.accessToken)
        localStorage.setItem("refreshToken", res.data.data.refreshToken)
        toast.success(res.data.message)
        dispatch(signInStore(res.data.data));
        router.push("/")
      }
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message)
      }
    },
  })

  function onSubmit(values: z.infer<typeof signInSchema>) {
    signInMutation.mutate(values)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Doc Assist</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Doc Assist</h1>
            <FieldDescription>
              Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
            </FieldDescription>
          </div>
          <Field data-invalid={!!errors.email_number}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              aria-invalid={!!errors.email_number}
              {...register("email_number")}
            />
            <FieldError errors={[errors.email_number]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Field>
            <Button type="submit" disabled={signInMutation.isPending}>
              {signInMutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 pt-2 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <Link href="#">Privacy Policy</Link>.
      </FieldDescription>
    </div>
  )
}

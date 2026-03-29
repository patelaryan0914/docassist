"use client"

import { cn } from "@/lib/utils"
import { DocAssistMark } from "@/components/doc-assist-mark"
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
import { signUp } from "@/lib/axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { useAppDispatch } from "@/store/hooks"
import { signInStore } from "@/store/authSlice"

const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email_number: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email_number: "",
      password: "",
      confirmPassword: "",
    },
  })

  const signUpMutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) => {
      return signUp(values.name, values.email_number, values.password)
    },
    onSuccess: (res) => {
      if (res.status == 201) {
        localStorage.setItem("accessToken", res.data.data.accessToken)
        localStorage.setItem("refreshToken", res.data.data.refreshToken)
        toast.success(res.data.message)
        dispatch(signInStore(res.data.data));
        router.push("/chat")
      }
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message)
      }
    },
  })

  function onSubmit(values: z.infer<typeof signUpSchema>) {
    signUpMutation.mutate(values)
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
          <div className="flex flex-col items-center gap-3 text-center">
            <DocAssistMark href="/" size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start chatting with documentation in minutes
              </p>
            </div>
            <FieldDescription>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </FieldDescription>
          </div>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Full Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>
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
          <Field data-invalid={!!errors.password || !!errors.confirmPassword}>
            <Field className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </Field>
            </Field>
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
            <FieldError errors={[errors.password, errors.confirmPassword]} />
          </Field>
          <Field>
            <Button
              type="submit"
              disabled={signUpMutation.isPending}
              className="h-10 w-full rounded-full shadow-md shadow-primary/20"
            >
              {signUpMutation.isPending ? "Creating account…" : "Create account"}
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

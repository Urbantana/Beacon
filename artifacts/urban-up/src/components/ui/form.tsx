import * as React from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"

export { useForm, FormProvider, zodResolver }

export const Form = FormProvider

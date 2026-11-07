"use client";

// Local shadcn/ui primitives, with cevora's variants and classes.
import * as Accordion from "@radix-ui/react-accordion";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { Accordion, AlertDialog, DropdownMenu, Tabs, Dialog };
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
const buttonVariants = cva("button", {
  variants: { variant: { primary: "button-primary", outline: "button-outline", ghost: "button-ghost", icon: "button-icon", danger: "button-danger" } },
  defaultVariants: { variant: "outline" },
});

export function Button({ className, variant, type = "button", ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input dir="auto" className={cn("input", className)} {...props} />;
}

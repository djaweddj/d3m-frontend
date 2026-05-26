"use client";

import * as React from "react";
import { Controller, FormProvider, useFormContext, useFormState } from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";
import { Label } from "./label";

/* ---------------- FORM ROOT ---------------- */

export const Form = FormProvider;

/* ---------------- CONTEXTS ---------------- */

const FormFieldContext = React.createContext(null);
const FormItemContext = React.createContext(null);

/* ---------------- FORM FIELD ---------------- */

export function FormField(props) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext?.name });

  if (!fieldContext) {
    throw new Error("useFormField must be used inside <FormField />");
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  return {
    name: fieldContext.name,
    id: itemContext?.id,
    formItemId: itemContext?.id ? `${itemContext.id}-item` : undefined,
    formDescriptionId: itemContext?.id ? `${itemContext.id}-desc` : undefined,
    formMessageId: itemContext?.id ? `${itemContext.id}-msg` : undefined,
    ...fieldState,
  };
}

/* ---------------- FORM ITEM ---------------- */

export function FormItem({ className, ...props }) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

/* ---------------- LABEL ---------------- */

export function FormLabel({ className, ...props }) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      htmlFor={formItemId}
      className={cn(error && "text-red-500", className)}
      {...props}
    />
  );
}

/* ---------------- CONTROL ---------------- */

export function FormControl({ ...props }) {
  const { formItemId, formDescriptionId, formMessageId, error } =
    useFormField();

  return (
    <Slot
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      {...props}
    />
  );
}

/* ---------------- DESCRIPTION ---------------- */

export function FormDescription({ className, ...props }) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
}

/* ---------------- MESSAGE ---------------- */

export function FormMessage({ className, ...props }) {
  const { error, formMessageId } = useFormField();

  if (!error?.message) return null;

  return (
    <p
      id={formMessageId}
      className={cn("text-sm text-red-500", className)}
      {...props}
    >
      {String(error.message)}
    </p>
  );
}
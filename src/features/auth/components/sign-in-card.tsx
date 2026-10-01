"use client";

import { z } from "zod";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema } from "../Schemas";
import { useLogin } from "../api/use-login";
import { GithubAuthButton, GithubAuthError } from "./github-auth-button";

export const SignInCard = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate, isPending } = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    mutate({ json: values });
  };

  return (
    <Card className="w-full border-border bg-card shadow-none md:w-[420px]">
      <CardHeader className="items-center px-7 pb-2 pt-8 text-center">
        <CardTitle className="text-[28px] font-semibold tracking-[-0.04em]">
          Welcome back
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign in to your Alder workspace.
        </p>
      </CardHeader>
      <CardContent className="px-7 pb-8 pt-4">
        <Suspense fallback={null}>
          <GithubAuthError />
        </Suspense>
        <GithubAuthButton />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter the email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <div className=" flex items-center justify-between">
                  <FormItem className="flex w-full relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter the password"
                      />
                    </FormControl>
                    <FormMessage />
                    <Button
                      variant={"secondary"}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1"
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </Button>
                  </FormItem>
                </div>
              )}
            />
            <Button disabled={isPending} size={"lg"} className=" w-full">
              Log In{" "}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

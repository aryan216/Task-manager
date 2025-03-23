"use client";

import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";

import { signUpWithGithub, signUpWithGoogle } from "@/lib/oauth";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DottedSeparator } from "@/components/dotted-separator";
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
    <Card className=" w-full h-full md:w-[487px] border border-neutral-700 shadow-none">
      <CardHeader className=" flex justify-center items-center text-center p-7">
        <CardTitle className=" text-2xl">Welcome Back</CardTitle>
      </CardHeader>
      <div className=" px-7 mb-2">
        <Separator />
        <DottedSeparator />
      </div>
      <CardContent className=" mt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      className=" absolute right-1"
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
      </CardContent>
      <div className=" px-7">
        <DottedSeparator />
      </div>
      <CardContent className=" p-7 flex flex-col gap-y-4">
        <Button
          onClick={() => signUpWithGoogle()}
          disabled={isPending}
          variant={"secondary"}
          size={"lg"}
          className=" w-full"
        >
          <FcGoogle className=" mr-2 size-5" />
          Login with Google
        </Button>
        <Button
          onClick={() => signUpWithGithub()}
          disabled={isPending}
          variant={"secondary"}
          size={"lg"}
          className=" w-full"
        >
          <FaGithub className=" mr-2 size-5" />
          Login with Github
        </Button>
      </CardContent>
      <div className=" px-7">
        <DottedSeparator />
      </div>
      <CardContent className=" p-7 flex items-center justify-center">
        <p>
          Don&apos;t have an account ?{" "}
          <Link href="/sign-up">
            <span className=" text-blue-700">Sign Up</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

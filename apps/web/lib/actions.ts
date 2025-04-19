"use server";

import { createServer } from "~/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Helper function to redirect with status messages
function redirectToPath(status: 'error' | 'success', path: string, message: string) {
  const params = new URLSearchParams();
  params.set(status, message);
  redirect(`${path}?${params.toString()}`);
}

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createServer();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return redirectToPath(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return redirectToPath("error", "/sign-up", error.message);
  } else {
    return redirectToPath(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirectToPath("error", "/sign-in", error.message);
  }

  return redirect("/product");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createServer();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return redirectToPath("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?redirect_to=/product/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return redirectToPath(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return redirectToPath(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createServer();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return redirectToPath(
      "error",
      "/product/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return redirectToPath(
      "error",
      "/product/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return redirectToPath(
      "error",
      "/product/reset-password",
      "Password update failed",
    );
  }

  return redirectToPath("success", "/product/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createServer();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

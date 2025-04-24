"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";


export default function HomePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/');
    },
  });
}
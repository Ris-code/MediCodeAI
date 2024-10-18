"use client";
import React from "react";
import {
  TextRevealCard,
  TextRevealCardDescription,
  TextRevealCardTitle,
} from "./ui/text-reveal-card";

export function TextRevealCardPreview() {
  return (
    (<div
      className="flex items-center justify-center bg-transparent rounded-2xl w-full">
      <TextRevealCard text="You possess the clinical expertise" revealText="Practice with an AI Patient" className="bg-transparent">
      </TextRevealCard>
    </div>)
  );
}



"use client";
import { Button, Link } from "@heroui/react";

export default function EmptyDiscoveryState({ message }) {
  return (
    <div className="py-12 max-w-2xl mx-auto text-center px-4">
      <div className="bg-white rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          No New Kanji to Discover
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
        <Button
          as={Link}
          href="/"
          size="lg"
          className="font-bold text-white bg-[#6A7FDB]"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
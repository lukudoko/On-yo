"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button, Card } from "@heroui/react";

export default function SignInClient({ providers }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4">
      <Card className="p-8 rounded-3xl border-4 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to <span className="font-jp">On&apos;yo</span>!
          </h1>
          {status === "authenticated" ? (
            <p className="text-gray-600">You are currently signed in</p>
          ) : (
            <p className="text-gray-600">Sign in to start learning kanji</p>
          )}
        </div>

        {status === "authenticated" ? (
          <div className="space-y-4">
            <p className="text-center">
              Signed in as{" "}
              <span className="font-semibold">
                {session.user?.name || session.user?.email || "User"}
              </span>
            </p>
            <Button
              color="danger"
              onPress={() => signOut({ callbackUrl: "/auth/signin" })}
              className="w-full"
              size="lg"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <>
            {Object.keys(providers).length > 0 ? (
              <div className="space-y-4">
                {Object.values(providers).map((provider) => (
                  <div key={provider.name}>
                    <Button
                      color="primary"
                      onPress={() => signIn(provider.id, { callbackUrl: "/" })}
                      className="w-full"
                      size="lg"
                    >
                      Sign in with {provider.name}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-red-500">
                <p>No authentication providers configured.</p>
                <p className="text-sm mt-2">Check your environment variables.</p>
              </div>
            )}

            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>By signing in, you agree to our privacy policy.</p>
              <p className="mt-2">
                We only store a hashed identifier - no personal information is stored.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
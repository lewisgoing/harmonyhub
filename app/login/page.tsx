import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignupForm from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Login | Hearing Heroes',
  description: 'Sign in to your Hearing Heroes account',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <header className="border-b bg-white p-4">
        <div className="container flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Hearing Heroes</h1>
            <p className="text-muted-foreground">
              Sign in to save your presets across devices
            </p>
            <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-md">
              Creating an account is optional - you can use the app without signing in!
            </div>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
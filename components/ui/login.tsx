"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { signIn, signUp } from "@/lib/auth-client"
import { toast } from "sonner"

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await signIn.email({
          email,
          password,
        })
        toast.success("Logged in successfully!")
      } else {
        await signUp.email({
          email,
          password,
          name: "",
        })
        toast.success("Account created successfully!")
      }
      onClose()
    } catch (error) {
      toast.error(isLogin ? "Login failed `" + error : "Sign up failed `" + error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      await signIn.social({
        provider: "google",
      })
    } catch (error) {
      toast.error("Google authentication failed `" + error)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-primary">
            {isLogin ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin ? 'Welcome back to IPO Milega' : 'Join IPO Milega today'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Button>
          <Button
            variant="ghost"
            className="text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

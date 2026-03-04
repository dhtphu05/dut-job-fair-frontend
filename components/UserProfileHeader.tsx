'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuthControllerGetProfile, useAuthControllerLogout } from '@/lib/api/generated/auth/auth'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function UserProfileHeader() {
    const router = useRouter()
    const queryClient = useQueryClient()

    // Fetch user profile
    const { data: profileResponse, isLoading } = useAuthControllerGetProfile()

    // Logout mutation
    const { mutateAsync: logout } = useAuthControllerLogout()

    const handleLogout = async () => {
        try {
            await logout()
        } catch (e) {
            // Even if backend fails, we clear local state
            console.error('Logout failed on backend', e)
        } finally {
            localStorage.removeItem('auth_token')
            queryClient.clear() // Clear all react-query cache
            toast.success('Đã đăng xuất')
            router.push('/login')
        }
    }

    const user = profileResponse?.data || (profileResponse as any)?.user || profileResponse

    if (isLoading) {
        return <div className="h-8 w-24 animate-pulse bg-gray-200 rounded-md"></div>
    }

    if (!user) {
        return (
            <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                Đăng nhập
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.role === 'SCHOOL_ADMIN' ? 'Ban tổ chức' : 'Doanh nghiệp'}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

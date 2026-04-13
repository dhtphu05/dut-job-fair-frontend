'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar'

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
            localStorage.removeItem('user_role')
            localStorage.removeItem('booth_id')
            queryClient.clear() // Clear all react-query cache
            toast.success('Đã đăng xuất thành công')
            router.push('/')
        }
    }

    const user = profileResponse?.data || (profileResponse as any)?.user || profileResponse
    const userEmail = user?.email || 'User'
    const userInitial = userEmail.charAt(0).toUpperCase()

    if (isLoading) {
        return <div className="h-9 w-9 animate-pulse bg-slate-200 rounded-full"></div>
    }

    if (!user) {
        return (
            <Button variant="outline" size="sm" onClick={() => router.push('/login')} className="h-9 px-4 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50">
                Đăng nhập
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-offset-2 focus-visible:ring-blue-600">
                        <Avatar className="h-9 w-9 border-2 border-blue-100 transition-all hover:scale-105 active:scale-95 shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}&backgroundColor=2563eb&textColor=ffffff`} />
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
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
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-9 w-9 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Đăng xuất"
            >
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
    )
}

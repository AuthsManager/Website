import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { User, Menu, Settings, LogOut } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header({ toggleSidebar }) {
    const { user } = useAuth();
    const location = useLocation();

    function logout() {
        localStorage.removeItem('token');
        window.location.replace('/auth/login');
    }

    const getName = () => {
        const routes = {
            '/dashboard': location.pathname.includes('/admin') ? 'Admin Dashboard' : 'Dashboard',
            '/users': 'Manage Users',
            '/licenses': 'Manage Licenses',
            '/apps': 'Manage Apps'
        };

        for (const [key, value] of Object.entries(routes)) {
            if (location.pathname.startsWith('/dash' + key) || location.pathname.startsWith('/admin' + key)) return value;
        }

        return location.pathname.includes('/admin') ? 'Admin Dashboard' : 'Dashboard';
    }

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50"></div>
            <div className="relative backdrop-blur-sm bg-background/30 border-b border-white/5">
                <div className="px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors md:hidden"
                        >
                            <Menu className="w-5 h-5 text-white/70" />
                        </button>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent truncate">
                            {getName()}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="hidden md:block text-white/70">Welcome back,&nbsp;
                            <span className="text-white font-medium">{user.username}</span>
                        </p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <User className="w-5 h-5 text-primary" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link 
                                        to="/dash/settings"
                                        className="flex items-center gap-2 w-full cursor-pointer"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={logout}
                                    className="flex items-center gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}

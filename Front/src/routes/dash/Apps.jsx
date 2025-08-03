import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { AppManagement } from "@/components/tables/management";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BASE_API, API_VERSION } from "../../config.json";

export default function Apps() {
    const location = useLocation();
    const { user, updateUser } = useAuth();
    const [name, setName] = useState('');
    const [apps, setApps] = useState([]);

    useEffect(() => {
        if (user.applications.length) setApps(user.applications);
    }, []);

    const createApp = async () => {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/apps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${location.pathname.includes('admin') ? 'Admin' : 'User'} ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name })
        }).catch(() => null);

        if (!response) return toast.error('Create app', { description: 'Failed to create your app. Try again.' });

        const json = await response.json().catch(() => null);

        if (response.ok) {
            if (!json) return toast.error('Create app', { description: 'Failed to create your app. Try again.' });

            setApps((prevApps) => [
                ...prevApps,
                json
            ]);
            updateUser({ ...user, applications: [...apps, json] });
            
            setName('');
            
            toast.success('Create app', { description: 'Successfully created your app.' });
        } else {
            toast.error('Create app', { description: json?.message || 'Failed to create your app. Try again.' });
        }
    };

    const renameApp = async (appId, name) => {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/apps/${appId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${location.pathname.includes('admin') ? 'Admin' : 'User'} ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newName: name })
        }).catch(() => null);

        if (!response) return toast.error('Rename app', { description: 'Failed to rename your app. Try again.' });

        if (response.ok) {
            const newApps = [...apps];
            newApps.find(app => app.id === appId).name = name;

            setApps(newApps);
            updateUser({ ...user, applications: newApps });

            toast.success('Rename app', { description: 'Successfully renamed your app.' });
        } else {
            const json = await response.json().catch(() => null);
            toast.error('Rename app', { description: json?.message || 'Failed to rename your app. Try again.' });
        }
    };

    async function deleteApp(appId) {
        const response = await fetch(`${BASE_API}/v${API_VERSION}/apps/${appId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `${location.pathname.includes('admin') ? 'Admin' : 'User'} ${localStorage.getItem('token')}`
            }
        }).catch(() => null);

        if (!response) return toast.error('Delete app', { description: 'Failed to delete your app. Try again.' });

        if (response.ok) {
            setApps(apps.filter(app => app.id !== appId));
            updateUser({ ...user, applications: apps.filter(app => app.id !== appId) });
            
            toast.success('Delete app', { description: 'Successfully deleted your app.' });
        } else {
            const json = await response.json().catch(() => null);
            toast.error('Delete app', { description: json?.message || 'Failed to delete your app. Try again.' });
        }
    }

    return (
        <div className="bg-[#0A1323] py-4 px-6 rounded-lg border border-[#1B2B4B]">
            <h2 className="text-xl md:text-2xl font-bold mb-4">App management</h2>
            <AlertDialog>
                <AlertDialogTrigger><Button className="mb-4">Create App</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader className="mb-2">
                        <AlertDialogTitle>Create a new app</AlertDialogTitle>
                        <AlertDialogDescription>Create a new application to manage your users an your licenses</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label>App name</Label>
                        <Input 
                            placeholder="App1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={!(name)} onClick={createApp}>Create</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AppManagement apps={apps} renameApp={renameApp} deleteApp={deleteApp} />
        </div>
    );
}
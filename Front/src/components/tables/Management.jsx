import React, { useState, useRef } from "react";
import { toast } from "sonner";
import moment from 'moment';
import TableManagement from "./Table";
import { Badge } from "@/components/ui/badge";
import { Ban, RefreshCw, Pencil, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { BASE_API, API_VERSION } from "../../config.json";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ActionButton = ({ onClick, icon: Icon, color = "red", tooltip }) => (
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger>
                <div 
                    onClick={onClick} 
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200
                        ${color === "red" 
                            ? "bg-[#1B2B4B] text-red-400 hover:bg-red-500/20" 
                            : "bg-[#1B2B4B] text-blue-400 hover:bg-blue-500/20"}`}
                >
                    <Icon className="w-4 h-4" />
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const UserManagement = ({ users, deleteUser, updateUser }) => {
    const { user } = useAuth();
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', appId: '' });
    const closeDialogRef = useRef(null);
    const columns = ["ID", "Username", "Linked App", "Actions"];

    const startEditing = (subUser) => {
        setEditingUser(subUser.id);
        setEditForm({
            username: subUser.username,
            password: '',
            appId: subUser.appId
        });
    };

    const cancelEditing = () => {
        setEditingUser(null);
        setEditForm({ username: '', password: '', appId: '' });
    };

    const manageUpdateUser = async () => {
        try {
            const updateData = {};
            if (editForm.username) updateData.username = editForm.username;
            if (editForm.password) updateData.password = editForm.password;
            if (editForm.appId) updateData.appId = editForm.appId;

            const response = await fetch(`${BASE_API}/v${API_VERSION}/subusers/${editingUser}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `User ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                if (updateUser) updateUser(editingUser, updateData);
                setEditingUser(null);
                setEditForm({ username: '', password: '', appId: '' });
                toast.success('Sub-user updated successfully');
                if (closeDialogRef.current) {
                    closeDialogRef.current.click();
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to update sub-user');
            }
        } catch (error) {
            console.error('Error updating sub-user:', error);
            toast.error('Error updating sub-user');
        }
    };

    const data = !users || !Array.isArray(users) ? [] : users.map(({ id, username, appId }) => ({
        id,
        username,
        linkedApp: user.applications.find(app => app.id === appId)?.name || 'Unknown',
        action: (
            <div className="flex items-center gap-2 justify-start md:justify-end">
                <ActionButton icon={Ban} tooltip="Ban" onClick={() => {}} />
                <Dialog>
                    <DialogTrigger asChild>
                        <div>
                            <ActionButton icon={Edit} color="blue" tooltip="Edit" />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-[#0A1323] border-[#1B2B4B]">
                        <DialogClose ref={closeDialogRef} className="hidden" />
                        <DialogHeader>
                            <DialogTitle className="text-white">Edit User: {username}</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Update the user information
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label htmlFor="edit-username" className="text-white mb-2 block">Username</Label>
                                <Input
                                    id="edit-username"
                                    value={editingUser === id ? editForm.username : username}
                                    onChange={(e) => {
                                        if (editingUser !== id) startEditing({ id, username, appId });
                                        setEditForm(prev => ({ ...prev, username: e.target.value }));
                                    }}
                                    className="bg-[#1B2B4B] border-[#2C3B5B] text-white"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-password" className="text-white mb-2 block">New Password (optional)</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={editingUser === id ? editForm.password : ''}
                                    onChange={(e) => {
                                        if (editingUser !== id) startEditing({ id, username, appId });
                                        setEditForm(prev => ({ ...prev, password: e.target.value }));
                                    }}
                                    className="bg-[#1B2B4B] border-[#2C3B5B] text-white"
                                    placeholder="Leave empty to keep current password"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-appId" className="text-white mb-2 block">Application</Label>
                                <Select 
                                    value={editingUser === id ? editForm.appId : appId} 
                                    onValueChange={(value) => {
                                        if (editingUser !== id) startEditing({ id, username, appId });
                                        setEditForm(prev => ({ ...prev, appId: value }));
                                    }}
                                >
                                    <SelectTrigger className="bg-[#1B2B4B] border-[#2C3B5B] text-white">
                                        <SelectValue placeholder="Select an app" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1B2B4B] border-[#2C3B5B]">
                                        {user.applications.map(app => (
                                            <SelectItem key={app.id} value={app.id} className="text-white hover:bg-[#2C3B5B]">
                                                {app.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={cancelEditing}
                                    className="text-gray-400 hover:text-white bg-[#2C3B5B] hover:bg-[#3C4B6B]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (editingUser !== id) startEditing({ id, username, appId });
                                        manageUpdateUser();
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <div>
                            <ActionButton icon={Trash2} tooltip="Delete" />
                        </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Do you really want to delete this user ?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <p className="text-sm text-muted-foreground">
                            This action is irreversible. The user "{username}" will be permanently deleted.
                        </p>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteUser(id)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }));

    return <TableManagement columns={columns} data={data} />;
};

const LicenseManagement = ({ licenses, renewLicense, deleteLicense }) => {
    const { user } = useAuth();
    const columns = [
        "ID",
        "Name of license",
        "Expiration Date",
        "Status",
        "Linked App",
        "Actions"
    ];

    const data = !licenses || !Array.isArray(licenses) ? [] : licenses.map(({ id, name, appId, expiration, used }) => ({
        id,
        name,
        expiration: moment(expiration).format('DD/MM/YYYY'),
        status: (
            <Badge variant={
                used ? 'warning' :
                Date.now() < expiration ? 'success' :
                'destructive'
            }>
                {used ? 'Used' : Date.now() < expiration ? 'Active' : 'Expired'}
            </Badge>
        ),
        linkedApp: user.applications.find(app => app.id === appId)?.name || 'Unknown',
        actions: (
            <div className="flex items-center gap-2 justify-start md:justify-end">
                <ActionButton icon={RefreshCw} color="blue" tooltip="Renew" onClick={() => renewLicense(id)} />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <div>
                            <ActionButton icon={Trash2} tooltip="Delete" />
                        </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Do you really want to delete this license ?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <p className="text-sm text-muted-foreground">
                            This action is irreversible. The “{name}” license will be permanently deleted.                        
                        </p>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteLicense(id)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }));

    return <TableManagement columns={columns} data={data} />;
};

const AppManagement = ({ apps, renameApp, deleteApp }) => {
    const [name, setName] = useState('');

    const SecretSpoiler = ({ secret }) => {
        const [copied, setCopied] = useState(false);

        const copyToClipboard = () => {
            navigator.clipboard.writeText(secret).then(() => {
                toast.success('App Secret', { description: 'Successfully copied to clipboard.' });
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); 
            });
        };

        const handleClick = () => {
            copyToClipboard();
        };

        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger>
                        <span 
                            onClick={handleClick} 
                            className={`cursor-pointer font-mono text-sm px-3 py-1 rounded-md bg-[#1B2B4B]
                                ${copied ? 'blur-none' : 'blur-sm'} transition duration-300`}
                        >
                            {secret}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{copied ? "Copied" : "Click to copy"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    const columns = ["ID", "Name", "Owner ID", "Secret", "Actions"];

    const data = apps.map(app => ({
        id: app.id,
        name: app.name,
        ownerId: app.ownerId,
        secret: <SecretSpoiler secret={app.secret} />,
        actions: (
            <div className="flex items-center gap-2 justify-start md:justify-end">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <div>
                            <ActionButton icon={Pencil} color="blue" tooltip="Rename" />
                        </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader className="mb-2">
                            <AlertDialogTitle>Rename app</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="flex flex-col gap-2">
                            <Label>App name</Label>
                            <Input 
                                placeholder={app.name}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                disabled={!(name)} 
                                onClick={() => renameApp(app.id, name)}
                            >
                                Rename
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <div>
                            <ActionButton icon={Trash2} tooltip="Delete" />
                        </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Do you really want to delete this application?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <p className="text-sm text-muted-foreground">
                            This action is irreversible. The “{app.name}” application and all its associated data will be permanently deleted.                        
                        </p>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteApp(app.id)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }));

    return <TableManagement columns={columns} data={data} />;
};

export { UserManagement, LicenseManagement, AppManagement };

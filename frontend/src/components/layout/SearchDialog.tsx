import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    User,
    FileText,
    ShoppingBag,
    Layers,
    FileCog
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";

export function SearchDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const navigate = useNavigate();
    const [data, setData] = useState<{
        products: any[];
        categories: any[];
        configs: any[];
    }>({ products: [], categories: [], configs: [] });
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open) {
            setSearch(""); // Reset search on open
            const fetchData = async () => {
                const [prodRes, catRes, confRes] = await Promise.allSettled([
                    api.get("/products"),
                    api.get("/categories"),
                    api.get("/test-configurations"),
                ]);

                setData({
                    products: prodRes.status === "fulfilled" && prodRes.value ? (prodRes.value as any).data || [] : [],
                    categories: catRes.status === "fulfilled" && catRes.value ? (catRes.value as any).data || [] : [],
                    configs: confRes.status === "fulfilled" && confRes.value ? (confRes.value as any).data || [] : [],
                });
            };

            fetchData();
        }
    }, [open]);

    const runCommand = (command: () => void) => {
        onOpenChange(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Type a command or search..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    <CommandItem
                        onSelect={() => runCommand(() => navigate("/dashboard"))}
                        className="cursor-pointer"
                        value="dashboard"
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => navigate("/practice"))}
                        className="cursor-pointer"
                        value="assessment history practice"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Assessment History</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                {search.length > 0 && data.products.length > 0 && (
                    <CommandGroup heading="Products">
                        {data.products.map((prod) => (
                            <CommandItem
                                key={prod._id}
                                onSelect={() => runCommand(() => navigate(`/products?search=${encodeURIComponent(prod.name)}`))}
                                className="cursor-pointer"
                                value={prod.name}
                            >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                <span>{prod.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {search.length > 0 && data.categories.length > 0 && (
                    <CommandGroup heading="Categories">
                        {data.categories.map((cat) => (
                            <CommandItem
                                key={cat._id}
                                onSelect={() => runCommand(() => navigate("/categories"))}
                                className="cursor-pointer"
                                value={cat.name}
                            >
                                <Layers className="mr-2 h-4 w-4" />
                                <span>{cat.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {search.length > 0 && data.configs.length > 0 && (
                    <CommandGroup heading="Test Configurations">
                        {data.configs.map((conf) => (
                            <CommandItem
                                key={conf.id || conf._id}
                                onSelect={() => runCommand(() => navigate("/test-setup"))}
                                className="cursor-pointer"
                                value={conf.name}
                            >
                                <FileCog className="mr-2 h-4 w-4" />
                                <span>{conf.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandSeparator />

                <CommandGroup heading="Settings">
                    <CommandItem
                        onSelect={() => runCommand(() => navigate("/settings"))}
                        className="cursor-pointer"
                        value="settings profile"
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile & Settings</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

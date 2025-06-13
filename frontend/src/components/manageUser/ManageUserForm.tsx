import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface ManageUserFormProps {
  form: {
    name: string;
    email: string;
    password?: string;
    role: "admin" | "employee";
    active: boolean;
  };
  setForm: (updater: (f: any) => any) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  isEdit?: boolean;
  onCancel: () => void;
}

const ManageUserForm: React.FC<ManageUserFormProps> = ({
  form,
  setForm,
  loading,
  error,
  onSubmit,
  isEdit = false,
  onCancel,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="flex-1 flex flex-col justify-start" onSubmit={onSubmit}>
      <div className="flex flex-col gap-6 py-4 px-1">
        <div className="flex flex-col gap-2">
          <label htmlFor={isEdit ? "edit-name" : "name"} className="font-medium">
            Name
          </label>
          <Input
            id={isEdit ? "edit-name" : "name"}
            value={form.name}
            onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={isEdit ? "edit-email" : "email"} className="font-medium">
            Email
          </label>
          <Input
            id={isEdit ? "edit-email" : "email"}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-2 relative">
          <label htmlFor={isEdit ? "edit-password" : "password"} className="font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id={isEdit ? "edit-password" : "password"}
              type={showPassword ? "text" : "password"}
              value={form.password || ""}
              onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))}
              className="pr-10"
              placeholder={isEdit ? "Leave blank to keep unchanged" : ""}
              required={!isEdit}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium">Role</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                id={isEdit ? "edit-employee" : "employee"}
                name={isEdit ? "edit-role" : "role"}
                value="employee"
                checked={form.role === "employee"}
                onChange={() => setForm((f: any) => ({ ...f, role: "employee" }))}
              />
              Employee
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                id={isEdit ? "edit-admin" : "admin"}
                name={isEdit ? "edit-role" : "role"}
                value="admin"
                checked={form.role === "admin"}
                onChange={() => setForm((f: any) => ({ ...f, role: "admin" }))}
              />
              Admin
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium" htmlFor={isEdit ? "edit-active-switch" : "active-switch"}>
            Active
          </label>
          <div className="flex items-center gap-3">
            <Switch
              id={isEdit ? "edit-active-switch" : "active-switch"}
              checked={form.active ?? true}
              onCheckedChange={(checked) => setForm((f: any) => ({ ...f, active: checked }))}
            />
            <span className="text-sm text-muted-foreground">
              {form.active ?? true ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
      <div className="mt-auto flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save Changes" : "Add User"}
        </Button>
      </div>
    </form>
  );
};

export default ManageUserForm;
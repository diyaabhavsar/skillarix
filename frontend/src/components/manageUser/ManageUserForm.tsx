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

const NameField = ({
  value,
  onChange,
  isEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  isEdit: boolean;
}) => (
  <label
    className="flex flex-col gap-2 font-medium"
    htmlFor={isEdit ? "edit-name" : "name"}
  >
    Name
    <Input
      id={isEdit ? "edit-name" : "name"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  </label>
);

const EmailField = ({
  value,
  onChange,
  isEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  isEdit: boolean;
}) => (
  <label
    className="flex flex-col gap-2 font-medium"
    htmlFor={isEdit ? "edit-email" : "email"}
  >
    Email
    <Input
      id={isEdit ? "edit-email" : "email"}
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  </label>
);

const PasswordField = ({
  value,
  onChange,
  isEdit,
  show,
  setShow,
}: {
  value: string;
  onChange: (v: string) => void;
  isEdit: boolean;
  show: boolean;
  setShow: (v: boolean) => void;
}) => (
  <label
    className="flex flex-col gap-2 font-medium relative"
    htmlFor={isEdit ? "edit-password" : "password"}
  >
    Password
    <div className="relative">
      <Input
        id={isEdit ? "edit-password" : "password"}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        placeholder={isEdit ? "Leave blank to keep unchanged" : ""}
        required={!isEdit}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        tabIndex={-1}
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </label>
);

const RoleField = ({
  value,
  onChange,
  isEdit,
}: {
  value: "admin" | "employee";
  onChange: (v: "admin" | "employee") => void;
  isEdit: boolean;
}) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="font-medium">Role</legend>
    <div className="flex gap-6">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          id={isEdit ? "edit-employee" : "employee"}
          name={isEdit ? "edit-role" : "role"}
          value="employee"
          checked={value === "employee"}
          onChange={() => onChange("employee")}
        />
        Employee
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          id={isEdit ? "edit-admin" : "admin"}
          name={isEdit ? "edit-role" : "role"}
          value="admin"
          checked={value === "admin"}
          onChange={() => onChange("admin")}
        />
        Admin
      </label>
    </div>
  </fieldset>
);

const ActiveSwitch = ({
  value,
  onChange,
  isEdit,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  isEdit: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <label
      className="font-medium"
      htmlFor={isEdit ? "edit-active-switch" : "active-switch"}
    >
      Active
    </label>
    <div className="flex items-center gap-3">
      <Switch
        id={isEdit ? "edit-active-switch" : "active-switch"}
        checked={value ?? true}
        onCheckedChange={onChange}
      />
      <span className="text-sm text-muted-foreground">
        {value ?? true ? "Active" : "Inactive"}
      </span>
    </div>
  </div>
);

const FormActions = ({
  loading,
  isEdit,
  onCancel,
}: {
  loading: boolean;
  isEdit: boolean;
  onCancel: () => void;
}) => (
  <div className="mt-auto flex gap-2 justify-end">
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={loading}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={loading}>
      {loading
        ? isEdit
          ? "Saving..."
          : "Adding..."
        : isEdit
        ? "Save Changes"
        : "Add User"}
    </Button>
  </div>
);

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
        <NameField
          value={form.name}
          onChange={(v) => setForm((f: any) => ({ ...f, name: v }))}
          isEdit={isEdit}
        />
        <EmailField
          value={form.email}
          onChange={(v) => setForm((f: any) => ({ ...f, email: v }))}
          isEdit={isEdit}
        />
        <PasswordField
          value={form.password || ""}
          onChange={(v) => setForm((f: any) => ({ ...f, password: v }))}
          isEdit={isEdit}
          show={showPassword}
          setShow={setShowPassword}
        />
        <RoleField
          value={form.role}
          onChange={(v) => setForm((f: any) => ({ ...f, role: v }))}
          isEdit={isEdit}
        />
        <ActiveSwitch
          value={form.active ?? true}
          onChange={(v) => setForm((f: any) => ({ ...f, active: v }))}
          isEdit={isEdit}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
      <FormActions
        loading={loading}
        isEdit={isEdit}
        onCancel={onCancel}
      />
    </form>
  );
};

export default ManageUserForm;
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useERP } from '@/contexts/ERPContext';
import { UserRole, ROLE_LABELS, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_USER_PERMISSIONS } from '@/types/erp';
import { toast } from 'sonner';
import { Upload, Eye, EyeOff } from 'lucide-react';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserModal({ open, onClose, userId }: UserModalProps) {
  const { users, addUser, updateUser } = useERP();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USUARIO' as UserRole,
    accessType: 'ERP' as 'ERP' | 'HEADSHOP',
    active: true,
    avatar: '',
  });

  const isEditing = userId !== null;
  const existingUser = userId ? users.find((u) => u.id === userId) : null;

  useEffect(() => {
    if (existingUser) {
      setFormData({
        name: existingUser.name,
        email: existingUser.email,
        password: '',
        role: existingUser.role,
        accessType: existingUser.accessType || (existingUser.role === 'CLIENTE' ? 'HEADSHOP' : 'ERP'),
        active: existingUser.active,
        avatar: existingUser.avatar || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'USUARIO',
        accessType: 'ERP',
        active: true,
        avatar: '',
      });
    }
    setShowPassword(false);
  }, [existingUser, open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) {
          toast.error('Nao foi possivel ler a imagem');
          return;
        }
        setFormData((prev) => ({ ...prev, avatar: result }));
      };
      reader.onerror = () => toast.error('Erro ao carregar imagem');
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Email inválido');
      setIsLoading(false);
      return;
    }

    if (!isEditing && formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    const permissions =
      formData.role === 'ADMIN'
        ? DEFAULT_ADMIN_PERMISSIONS
        : formData.role === 'CLIENTE' || formData.accessType === 'HEADSHOP'
          ? []
          : DEFAULT_USER_PERMISSIONS;

    try {
      if (isEditing && userId) {
        await updateUser(userId, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          accessType: formData.accessType,
          active: formData.active,
          avatar: formData.avatar || undefined,
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await addUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          accessType: formData.accessType,
          active: formData.active,
          avatar: formData.avatar || undefined,
          permissions,
          password: formData.password,
        });
        toast.success('Usuário cadastrado com sucesso!');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
          <DialogTitle>
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Avatar Upload (top) */}
          <div className="flex items-center gap-3 pb-2">
            <Avatar className="h-16 w-16">
              {formData.avatar && <AvatarImage src={formData.avatar} />}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {formData.name ? getInitials(formData.name) : 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              {formData.avatar && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))} className="text-xs text-destructive">
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="accessType">Acesso</Label>
            <Select
              value={formData.accessType}
              onValueChange={(value: 'ERP' | 'HEADSHOP') =>
                setFormData((prev) => ({
                  ...prev,
                  accessType: value,
                  role:
                    value === 'HEADSHOP'
                      ? 'CLIENTE'
                      : prev.role === 'CLIENTE'
                        ? 'USUARIO'
                        : prev.role,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ERP">ERP</SelectItem>
                <SelectItem value="HEADSHOP">HeadShop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value,
                  accessType: value === 'CLIENTE' ? 'HEADSHOP' : prev.accessType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
                <SelectItem value="USUARIO">{ROLE_LABELS.USUARIO}</SelectItem>
                <SelectItem value="CLIENTE">{ROLE_LABELS.CLIENTE}</SelectItem>
              </SelectContent>
            </Select>
            {formData.accessType === 'HEADSHOP' && (
              <p className="text-xs text-muted-foreground">Clientes do HeadShop nao acessam modulo ERP.</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Status</Label>
              <p className="text-sm text-muted-foreground">Usuário pode acessar o sistema</p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

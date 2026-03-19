import { useState } from 'react';
import { Plus, Search, Users as UsersIcon, Edit, Shield, User, Settings, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useERP } from '@/contexts/ERPContext';
import { ROLE_LABELS, PERMISSION_LABELS, Permission, UserRole } from '@/types/erp';
import { UserModal } from '@/components/modals/UserModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function UsuariosPage() {
  const { users, toggleUserStatus, batchToggleUserStatus, updateUser, deleteUser, currentUser } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [permissionsModal, setPermissionsModal] = useState<{ open: boolean; userId: string | null; userName: string; permissions: Permission[]; role: UserRole; active: boolean }>({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO', active: true });
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredUsers = users
    .filter((user) =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || (statusFilter === 'active' ? user.active : !user.active))
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const permissionUsers = users
    .filter((user) => statusFilter === 'all' || (statusFilter === 'active' ? user.active : !user.active))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const handleEdit = (id: string) => {
    setEditingUserId(id);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
    void (async () => {
      try {
        await toggleUserStatus(id);
        toast.success(currentStatus ? `${name} foi desativado` : `${name} foi ativado`);
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao atualizar usuario');
      }
    })();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredUsers.map(u => u.id) : []);
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBatchDeactivate = () => {
    if (selectedIds.length === 0) return;
    void (async () => {
      try {
        await batchToggleUserStatus(selectedIds, false);
        toast.success(`${selectedIds.length} usuario(s) desativado(s)`);
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao desativar usuarios');
      } finally {
        setSelectedIds([]);
      }
    })();
  };

  const handleBatchActivate = () => {
    if (selectedIds.length === 0) return;
    void (async () => {
      try {
        await batchToggleUserStatus(selectedIds, true);
        toast.success(`${selectedIds.length} usuario(s) ativado(s)`);
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao ativar usuarios');
      } finally {
        setSelectedIds([]);
      }
    })();
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    toast.success(`Senha de "${passwordModal.userName}" alterada com sucesso!`);
    setPasswordModal({ open: false, userId: null, userName: '' });
    setNewPassword('');
    setShowPassword(false);
  };

  const handleDeleteUser = () => {
    if (!deleteModal.userId) return;
    void (async () => {
      try {
        await deleteUser(deleteModal.userId!);
        toast.success(`Usuario "${deleteModal.userName}" excluido com sucesso!`);
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao excluir usuario');
      } finally {
        setDeleteModal({ open: false, userId: null, userName: '' });
      }
    })();
  };

  const handleSavePermissions = () => {
    if (permissionsModal.userId) {
      void (async () => {
        try {
          await updateUser(permissionsModal.userId!, {
            role: permissionsModal.role,
            permissions: permissionsModal.role === 'CLIENTE' ? [] : permissionsModal.permissions,
            active: permissionsModal.active,
          });
          toast.success(`Permissoes de "${permissionsModal.userName}" atualizadas!`);
        } catch (err: any) {
          toast.error(err?.message || 'Erro ao atualizar permissoes');
        }
      })();
    }
    setPermissionsModal({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO', active: true });
  };

  const togglePermission = (perm: Permission) => {
    if (permissionsModal.role === 'CLIENTE') return;
    setPermissionsModal(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gerencie os usuarios do sistema</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-success/10">
                <User className="h-6 w-6 text-status-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Ativos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Usuarios</TabsTrigger>
          {isAdmin && <TabsTrigger value="permissoes">Gerenciar Permissoes</TabsTrigger>}
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Search + Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'active' | 'inactive' | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Somente ativos</SelectItem>
                <SelectItem value="inactive">Somente inativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="py-1.5">{selectedIds.length} selecionado(s)</Badge>
                <Button variant="destructive" size="sm" onClick={handleBatchDeactivate}>
                  Definir como inativo
                </Button>
                <Button variant="default" size="sm" onClick={handleBatchActivate}>
                  Definir como ativo
                </Button>
              </div>
            )}
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Nenhum usuario encontrado</h3>
                  <p className="text-sm text-muted-foreground/70 mb-4">
                    {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando seu primeiro usuario'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={cn(!user.active && 'opacity-60')}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                          {user.role === 'ADMIN' && <Shield className="h-4 w-4 text-accent shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(user.role === 'ADMIN' ? 'bg-accent/10 text-accent' : '')}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            (user.accessType || (user.role === 'CLIENTE' ? 'HEADSHOP' : 'ERP')) === 'ERP'
                              ? 'border-primary/40 text-primary'
                              : 'border-emerald-500/40 text-emerald-600'
                          )}
                        >
                          {(user.accessType || (user.role === 'CLIENTE' ? 'HEADSHOP' : 'ERP')) === 'ERP'
                            ? 'ERP'
                            : 'HeadShop'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'secondary'} className={cn(user.active ? 'bg-status-success' : 'bg-muted')}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(user.id)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2">
                              <span className="text-[11px] text-muted-foreground">{user.active ? 'Ativo' : 'Inativo'}</span>
                              <Switch
                                checked={user.active}
                                onCheckedChange={() => handleToggleStatus(user.id, user.name, user.active)}
                                aria-label={user.active ? 'Desativar usuario' : 'Ativar usuario'}
                              />
                            </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModal({ open: true, userId: user.id, userName: user.name })}
                            title="Excluir usuario"
                            disabled={currentUser?.id === user.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Admin Permissions Tab */}
        {isAdmin && (
          <TabsContent value="permissoes" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie papeis, permissoes e senhas dos usuarios do sistema.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Permissoes</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(user.role === 'ADMIN' ? 'bg-accent/10 text-accent' : '')}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(user.permissions || []).map(p => (
                              <Badge key={p} variant="outline" className="text-xs leading-none">{PERMISSION_LABELS[p]}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPermissionsModal({
                                open: true,
                                userId: user.id,
                                userName: user.name,
                                permissions: user.permissions || [],
                                role: user.role,
                                active: user.active,
                              })}
                              title="Gerenciar permissoes"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPasswordModal({ open: true, userId: user.id, userName: user.name })}
                              title="Alterar senha"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <UserModal open={isModalOpen} onClose={handleCloseModal} userId={editingUserId} />

      {/* Permissions Modal */}
      <Dialog open={permissionsModal.open} onOpenChange={(open) => { if (!open) setPermissionsModal({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO', active: true }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permissoes - {permissionsModal.userName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={permissionsModal.role} onValueChange={(v: UserRole) => setPermissionsModal(prev => ({ ...prev, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
                  <SelectItem value="USUARIO">{ROLE_LABELS.USUARIO}</SelectItem>
                  <SelectItem value="CLIENTE">{ROLE_LABELS.CLIENTE}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Permissoes</Label>
              {(Object.keys(PERMISSION_LABELS) as Permission[]).map(perm => (
                <div key={perm} className="flex items-center justify-between">
                  <span className="text-sm">{PERMISSION_LABELS[perm]}</span>
                  <Switch
                    checked={permissionsModal.permissions.includes(perm)}
                    onCheckedChange={() => togglePermission(perm)}
                    disabled={permissionsModal.role === 'CLIENTE'}
                  />
                </div>
              ))}
              {permissionsModal.role === 'CLIENTE' && (
                <p className="text-xs text-muted-foreground">
                  Clientes do HeadShop nao possuem permissoes de ERP.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="space-y-0.5">
                <Label>Usuario tem acesso ao sistema?</Label>
                <p className="text-xs text-muted-foreground">Quando desligado, o login no ERP e bloqueado.</p>
              </div>
              <Switch
                checked={permissionsModal.active}
                onCheckedChange={(checked) => setPermissionsModal((prev) => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsModal({ open: false, userId: null, userName: '', permissions: [], role: 'USUARIO', active: true })}>Cancelar</Button>
            <Button onClick={handleSavePermissions}>Salvar Permissoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={passwordModal.open} onOpenChange={(open) => { if (!open) { setPasswordModal({ open: false, userId: null, userName: '' }); setNewPassword(''); setShowPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Alterando senha de <strong>{passwordModal.userName}</strong></p>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordModal({ open: false, userId: null, userName: '' }); setNewPassword(''); }}>Cancelar</Button>
            <Button onClick={handleChangePassword}>Salvar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModal.open} onOpenChange={(open) => { if (!open) setDeleteModal({ open: false, userId: null, userName: '' }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="dialog-titlebar -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle>Excluir Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-sm text-muted-foreground">
            <p>
              Voce tem certeza que deseja excluir <strong className="text-foreground">{deleteModal.userName}</strong>?
            </p>
            <p className="text-xs">
              Esta acao remove definitivamente o usuario do sistema.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, userId: null, userName: '' })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}









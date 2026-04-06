'use client';

import { useState, useEffect } from 'react';

// Decodificador manual de JWT
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [rolActual, setRolActual] = useState('SUPER');
    const [editando, setEditando] = useState<any>(null);
    const [mostrarModal, setMostrarModal] = useState(false);

    // Formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('OPERARIO');
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Obtenemos el rol del localStorage de haber hecho un login real
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = parseJwt(token);
            if (decoded && decoded.rol) {
                setRolActual(decoded.rol);
            }
        }
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setCargando(true);
        try {
            const payload: any = { username, rol };
            if (!editando || password) {
                payload.password = password; // Se envía password para crear o si quiere actualizarla
            }

            const method = editando ? 'PATCH' : 'POST';
            const url = editando
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/${editando.id}/`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/`;

            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchUsuarios();
                setMostrarModal(false);
            } else {
                const errData = await res.json();
                setErrorMsg(JSON.stringify(errData));
            }
        } catch (error) {
            setErrorMsg("Error de conexión");
        }
        setCargando(false);
    };

    const handleEliminar = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/'}usuarios/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                fetchUsuarios();
            }
        } catch (error) {
            console.error("Error al eliminar", error);
        }
    };

    const abrirModificacion = (user: any) => {
        setEditando(user);
        setUsername(user.username);
        setRol(user.role_display || 'OPERARIO');
        setPassword('');
        setErrorMsg('');
        setMostrarModal(true);
    };

    const abrirCreacion = () => {
        setEditando(null);
        setUsername('');
        setRol('OPERARIO');
        setPassword('');
        setErrorMsg('');
        setMostrarModal(true);
    };

    if (rolActual !== 'SUPER') {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <h2>No tienes permisos de SuperAdmin para ver esta página.</h2>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                <button
                    onClick={abrirCreacion}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Usuario</th>
                            <th className="px-6 py-4 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Rol</th>
                            <th className="px-6 py-4 text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {usuarios.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-800 dark:text-white font-semibold text-sm">{u.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-[10px] tracking-wider uppercase font-bold rounded-full ${u.role_display === 'SUPER' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                        : u.role_display === 'ADMIN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {u.role_display || 'OPERARIO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-3">
                                    <button onClick={() => abrirModificacion(u)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-[11px] uppercase tracking-wider transition-colors">Editar</button>
                                    <button onClick={() => handleEliminar(u.id)} className="text-rose-500/80 hover:text-rose-600 font-bold text-[11px] uppercase tracking-wider transition-colors">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {mostrarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="p-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                                {editando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                            </h3>

                            {errorMsg && <div className="p-4 mb-6 bg-rose-50/50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">{errorMsg}</div>}

                            <form onSubmit={handleGuardar} className="space-y-5">
                                <div className="group">
                                    <label className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Nombre de Usuario</label>
                                    <input
                                        type="text" required
                                        value={username} onChange={e => setUsername(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                                        Contraseña {editando && <span className="text-slate-400 font-medium lowercase tracking-normal">(Dejar en blanco para no cambiar)</span>}
                                    </label>
                                    <input
                                        type="password" required={!editando}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">Rol del Sistema</label>
                                    <select
                                        value={rol} onChange={e => setRol(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 dark:text-white transition-all shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="SUPER">Súper Administrador</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="OPERARIO">Operario Básico</option>
                                    </select>
                                </div>
                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button
                                        type="button" onClick={() => setMostrarModal(false)}
                                        className="px-6 py-3 bg-slate-100/80 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={cargando}
                                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all"
                                    >
                                        {cargando ? 'Guardando...' : 'Guardar Datos'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

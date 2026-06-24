'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAlert } from '@/app/alert-provider';


interface TicketAttachment {
    id: number;
    image_url: string;
    uploaded_at: string;
    space_name?: string;
    uploaded_by?: number;
    uploaded_by_detail?: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
    } | null;
}

interface InventorySpacePhoto {
    id: number;
    image_url: string;
    thumbnail_url: string | null;
    description: string | null;
    uploaded_at: string;
}

interface InventorySpace {
    id: number;
    space_name: string;
    condition: 'GOOD' | 'REGULAR' | 'BAD';
    condition_display: string;
    observations: string | null;
    photos: InventorySpacePhoto[];
}

interface InitialInventory {
    id: number;
    inventory_type: string;
    inventory_type_display: string;
    status: string;
    delivery_date: string;
    observations: string | null;
    spaces: InventorySpace[];
    created_at: string;
}

interface TicketHistoryEntry {
    id: number;
    action: string;
    action_display: string;
    description: string;
    old_value: string;
    new_value: string;
    created_by: number | null;
    created_by_detail: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
    } | null;
    created_at: string;
}

interface Ticket {
    id: number;
    public_code: string;
    title: string;
    description: string;
    damage_type: string;
    damage_type_display: string;
    damage_type_other: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    priority_display: string;
    status: 'DRAFT' | 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'REJECTED' | 'CLOSED' | 'PENDING_ADMIN' | 'PENDING_TENANT';
    status_display: string;
    created_at: string;
    updated_at: string;
    rejection_reason?: string;
    assigned_contractor_name?: string;
    assigned_technicians?: number[];
    assigned_technicians_detail?: {
        id: number;
        public_code: string;
        email: string;
        first_name: string;
        last_name: string;
    }[];
    property?: {
        id: number;
        code: string;
        address: string;
        city?: string;
        type?: string;
        status?: string;
        rooms?: number | null;
        bathrooms?: number | null;
        living_rooms?: number | null;
        kitchens?: number | null;
        garages?: number | null;
    } | null;
    tenant?: number;
    tenant_detail?: {
        id: number;
        public_code: string;
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
    } | null;
    attachments: TicketAttachment[];
    final_space_conditions?: {
        space_name: string;
        condition: 'GOOD' | 'REGULAR' | 'BAD';
        condition_display: string;
        observations?: string;
    }[];
}

const didConditionWorsen = (initial: string, final: string) => {
    const initialUpper = initial?.toUpperCase();
    const finalUpper = final?.toUpperCase();
    if (initialUpper === 'GOOD' && (finalUpper === 'REGULAR' || finalUpper === 'BAD')) return true;
    if (initialUpper === 'REGULAR' && finalUpper === 'BAD') return true;
    return false;
};


export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showConfirm, showAlert } = useAlert();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportingProblem, setReportingProblem] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [adminRejectionReason, setAdminRejectionReason] = useState('');
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [rejectionModalText, setRejectionModalText] = useState('');
    const [isRejectionSubmitting, setIsRejectionSubmitting] = useState(false);
    const [openTechnicianSpaces, setOpenTechnicianSpaces] = useState<Record<string, boolean>>({});

    const toggleTechnicianSpace = (spaceName: string) => {
        setOpenTechnicianSpaces(prev => ({
            ...prev,
            [spaceName]: !prev[spaceName]
        }));
    };
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Roles and Admin update fields
    const [userRole, setUserRole] = useState<string>('');
    const [adminStatus, setAdminStatus] = useState<string>('OPEN');
    const [adminContractor, setAdminContractor] = useState<string>('');
    const [selectedTechnicians, setSelectedTechnicians] = useState<number[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    // Ticket history
    const [ticketHistory, setTicketHistory] = useState<TicketHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Technician evidence upload
    const [uploadingEvidence, setUploadingEvidence] = useState(false);

    // Inventory comparison (for CLOSURE tickets)
    const [initialInventory, setInitialInventory] = useState<InitialInventory | null>(null);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [finalConditions, setFinalConditions] = useState<{
        space_name: string;
        condition: 'GOOD' | 'REGULAR' | 'BAD';
        observations: string;
        items: { name: string; checked: boolean }[];
    }[]>([]);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const getToken = () => localStorage.getItem('token');

    const fetchTicketDetails = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTicket(data);
                setAdminStatus(data.status);
                setAdminContractor(data.assigned_contractor_name || '');
                setSelectedTechnicians(data.assigned_technicians || []);
                setAdminRejectionReason(data.rejection_reason || '');
            } else {
                setError('No se pudo encontrar el ticket especificado.');
            }
        } catch (err) {
            console.error('Error fetching ticket details:', err);
            setError('Error de comunicación con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketHistory = async () => {
        setHistoryLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/history/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTicketHistory(Array.isArray(data) ? data : (data.results || []));
            }
        } catch (err) {
            console.error('Error fetching ticket history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/users/?role=TECHNICIAN&active=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTechnicians(data.results || data);
            }
        } catch (err) {
            console.error('Error fetching technicians:', err);
        }
    };

    const fetchInitialInventory = async (propertyId: number, tenantId: number) => {
        if (!ticket) return;
        setInventoryLoading(true);
        try {
            const token = getToken();
            const res = await fetch(
                `${API_URL}/api/v1/inventarios/?property_id=${propertyId}&tenant_id=${tenantId}&type=INITIAL&created_before=${ticket.created_at}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                if (items.length > 0) {
                    // Fetch full detail with spaces
                    const detailRes = await fetch(`${API_URL}/api/v1/inventarios/${items[0].id}/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (detailRes.ok) {
                        setInitialInventory(await detailRes.json());
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching initial inventory:', err);
        } finally {
            setInventoryLoading(false);
        }
    };



    useEffect(() => {
        // Decode token to get user role
        const token = getToken();
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                const role = decoded.role || decoded.rol;
                if (role) {
                    setUserRole(role);
                }
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }

        if (params.id) {
            fetchTicketDetails();
            fetchTicketHistory();
        }
    }, [params.id]);

    useEffect(() => {
        if (userRole === 'ADMIN' || userRole === 'ASSISTANT') {
            fetchTechnicians();
        }
    }, [userRole]);

    // Fetch initial inventory for comparison when admin/assistant/technician views a CLOSURE ticket
    useEffect(() => {
        if (
            ticket &&
            ticket.damage_type === 'CLOSURE' &&
            ticket.tenant_detail &&
            ticket.property?.id
        ) {
            fetchInitialInventory(ticket.property.id, ticket.tenant_detail.id);
        }
    }, [ticket?.id]);

    useEffect(() => {
        if (ticket && ticket.damage_type === 'CLOSURE') {
            if (initialInventory && initialInventory.spaces && initialInventory.spaces.length > 0) {
                setFinalConditions(initialInventory.spaces.map(s => ({
                    space_name: s.space_name,
                    condition: s.condition || 'GOOD',
                    observations: '',
                    items: [
                        { name: 'Paredes y pintura', checked: true },
                        { name: 'Pisos y zócalos', checked: true },
                        { name: 'Puertas y cerraduras', checked: false },
                        { name: 'Ventanas y persianas', checked: false },
                        { name: 'Iluminación', checked: true }
                    ]
                })));
                setOpenTechnicianSpaces({
                    [initialInventory.spaces[0].space_name]: true
                });
            } else if (!inventoryLoading && !initialInventory) {
                const generated: any[] = [];
                const defaultItems = [
                    { name: 'Paredes y pintura', checked: true },
                    { name: 'Pisos y zócalos', checked: true },
                    { name: 'Puertas y cerraduras', checked: false },
                    { name: 'Ventanas y persianas', checked: false },
                    { name: 'Iluminación', checked: true }
                ];
                
                const addSpaces = (name: string, count: number | null | undefined) => {
                    const num = Number(count);
                    if (!isNaN(num) && num > 0) {
                        for (let i = 1; i <= num; i++) {
                            generated.push({
                                space_name: `${name} ${i}`,
                                condition: 'GOOD',
                                observations: '',
                                items: defaultItems.map(item => ({ ...item }))
                            });
                        }
                    }
                };

                const prop = ticket.property;
                if (prop) {
                    addSpaces('Habitación', prop.rooms);
                    addSpaces('Baño', prop.bathrooms);
                    addSpaces('Sala / Comedor', prop.living_rooms);
                    addSpaces('Cocina', prop.kitchens);
                    addSpaces('Garaje', prop.garages);
                }

                if (generated.length === 0) {
                    setFinalConditions([
                        { space_name: 'Sala / Comedor 1', condition: 'GOOD', observations: '', items: defaultItems.map(item => ({ ...item })) },
                        { space_name: 'Cocina 1', condition: 'GOOD', observations: '', items: defaultItems.map(item => ({ ...item })) },
                        { space_name: 'Habitación 1', condition: 'GOOD', observations: '', items: defaultItems.map(item => ({ ...item })) },
                        { space_name: 'Baño 1', condition: 'GOOD', observations: '', items: defaultItems.map(item => ({ ...item })) }
                    ]);
                    setOpenTechnicianSpaces({
                        'Sala / Comedor 1': true
                    });
                } else {
                    setFinalConditions(generated);
                    setOpenTechnicianSpaces({
                        [generated[0].space_name]: true
                    });
                }
            }
        }
    }, [initialInventory, inventoryLoading, ticket]);

    const handleConfirmRepair = async () => {
        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/confirm/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setSelectedTechnicians(updated.assigned_technicians || []);
                fetchTicketHistory();
                await showAlert('Reparación confirmada con éxito. El ticket ha sido cerrado.', 'success');
            } else {
                await showAlert('Ocurrió un error al confirmar la reparación.', 'error');
            }
        } catch (err) {
            console.error('Error confirming repair:', err);
            await showAlert('Error de conexión con el servidor.', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    const handleConfirmRepairAdmin = async () => {
        const confirmed = await showConfirm(
            'Al aprobar este inventario final, el arrendamiento quedará cancelado y el inmueble pasará a estar disponible. ¿Deseas continuar?',
            'Aprobar Inventario Final y Cerrar Contrato'
        );
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/confirm/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setSelectedTechnicians(updated.assigned_technicians || []);
                fetchTicketHistory();
                await showAlert('Inventario final aprobado. El contrato ha sido cerrado y el inmueble está disponible.', 'success');
            } else {
                const errData = await res.json().catch(() => null);
                await showAlert(errData?.message || errData?.error || 'Error al aprobar el inventario.', 'error');
            }
        } catch (err) {
            console.error('Error approving closure:', err);
            await showAlert('Error de conexión con el servidor.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminRejectSubmit = async () => {
        if (!rejectionModalText.trim()) return;
        setIsRejectionSubmitting(true);
        try {
            const token = getToken();
            const isClosure = ticket?.damage_type === 'CLOSURE';
            const endpoint = isClosure 
                ? `${API_URL}/api/v1/tickets/${params.id}/reject/` 
                : `${API_URL}/api/v1/tickets/${params.id}/admin-reject/`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: rejectionModalText.trim() })
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setSelectedTechnicians(updated.assigned_technicians || []);
                setAdminRejectionReason(updated.rejection_reason || '');
                setShowRevertModal(false);
                setRejectionModalText('');
                fetchTicketHistory();
                await showAlert('El ticket ha sido rechazado exitosamente.', 'info');
            } else {
                const errData = await res.json().catch(() => null);
                await showAlert(errData?.error || 'Ocurrió un error al rechazar el ticket.', 'error');
            }
        } catch (err) {
            console.error('Error rejecting ticket:', err);
            await showAlert('Error de conexión con el servidor.', 'error');
        } finally {
            setIsRejectionSubmitting(false);
        }
    };

    const handleAdminApproveNormal = async () => {
        const confirmed = await showConfirm(
            '¿Deseas aprobar y cerrar esta reparación?',
            'Aprobar Reparación'
        );
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/admin-approve/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setSelectedTechnicians(updated.assigned_technicians || []);
                fetchTicketHistory();
                await showAlert('Reparación aprobada y ticket cerrado con éxito.', 'success');
            } else {
                const errData = await res.json().catch(() => null);
                await showAlert(errData?.error || 'Ocurrió un error al aprobar la reparación.', 'error');
            }
        } catch (err) {
            console.error('Error approving repair:', err);
            await showAlert('Error de conexión con el servidor.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminRejectNormal = () => {
        setRejectionModalText('');
        setShowRevertModal(true);
    };

    const handleRejectClosureAdmin = async () => {
        const confirmed = await showConfirm(
            '¿Deseas rechazar esta solicitud de cierre de contrato? El ticket pasará a estado Rechazado.',
            'Rechazar Solicitud de Cierre'
        );
        if (!confirmed) return;
        setRejectionModalText('');
        setShowRevertModal(true);
    };

    const handleReportProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectionReason.trim()) {
            await showAlert('Por favor describe el inconveniente antes de enviar.', 'warning');
            return;
        }

        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/report-problem/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: rejectionReason.trim() })
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setSelectedTechnicians(updated.assigned_technicians || []);
                setReportingProblem(false);
                setRejectionReason('');
                fetchTicketHistory();
                await showAlert('Reporte de inconveniente enviado. El ticket ha sido actualizado.', 'info');
            } else {
                await showAlert('Ocurrió un error al enviar el reporte.', 'error');
            }
        } catch (err) {
            console.error('Error reporting problem:', err);
            await showAlert('Error de conexión.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminStatus === 'REJECTED' && !adminRejectionReason.trim()) {
            await showAlert('Por favor describe el motivo del rechazo del ticket.', 'warning');
            return;
        }
        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/update-status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: adminStatus,
                    assigned_contractor_name: adminContractor,
                    assigned_technicians: selectedTechnicians,
                    rejection_reason: adminStatus === 'REJECTED' ? adminRejectionReason.trim() : undefined
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                setAdminStatus(updated.status);
                setAdminContractor(updated.assigned_contractor_name || '');
                setSelectedTechnicians(updated.assigned_technicians || []);
                fetchTicketHistory();
                await showAlert('El ticket ha sido actualizado exitosamente.', 'success');
            } else {
                const errData = await res.json();
                await showAlert(errData.error || 'Ocurrió un error al actualizar el ticket.', 'error');
            }
        } catch (err) {
            console.error('Error updating ticket:', err);
            await showAlert('Error de conexión.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTechnicianUpload = async (e: React.ChangeEvent<HTMLInputElement>, spaceName?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingEvidence(true);
        try {
            const token = getToken();
            const formData = new FormData();
            formData.append('image', file);
            if (spaceName) {
                formData.append('space_name', spaceName);
            }
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/technician-attachments/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                await fetchTicketDetails();
                fetchTicketHistory();
                await showAlert('Evidencia subida exitosamente.', 'success');
            } else {
                const errData = await res.json().catch(() => null);
                await showAlert(errData?.message || errData?.error || 'Error al subir la evidencia.', 'error');
            }
        } catch (err) {
            console.error('Error uploading evidence:', err);
            await showAlert('Error de conexión.', 'error');
        } finally {
            setUploadingEvidence(false);
            e.target.value = '';
        }
    };

    const handleDeleteTechnicianAttachment = async (attachmentId: number) => {
        const confirmed = await showConfirm('¿Estás seguro de que deseas eliminar esta foto de evidencia?', 'Eliminar Foto');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/delete-attachment/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ attachment_id: attachmentId })
            });

            if (res.ok) {
                await fetchTicketDetails();
                fetchTicketHistory();
                await showAlert('Foto eliminada exitosamente.', 'success');
            } else {
                const errData = await res.json().catch(() => null);
                await showAlert(errData?.message || errData?.error || 'Error al eliminar la foto.', 'error');
            }
        } catch (err) {
            console.error('Error deleting photo:', err);
            await showAlert('Error de conexión.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const isClosureTicket = ticket?.damage_type === 'CLOSURE';
    const handleTechnicianComplete = async () => {
        const confirmMsg = isClosureTicket
            ? '¿Estás seguro de marcar este inventario final como completado? Un administrador o asistente deberá aprobarlo para finalizar el contrato.'
            : '¿Estás seguro de marcar este ticket como completado? El administrador deberá aprobar la reparación.';
        const confirmed = await showConfirm(confirmMsg, 'Marcar como Completado');
        if (!confirmed) return;

        setActionLoading(true);
        try {
            const token = getToken();

            // 1. Save final space conditions first if it is a CLOSURE ticket and there are conditions to save
            if (isClosureTicket && finalConditions.length > 0) {
                const saveRes = await fetch(`${API_URL}/api/v1/tickets/${params.id}/save-final-conditions/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ conditions: finalConditions }),
                });
                if (!saveRes.ok) {
                    const saveErr = await saveRes.json().catch(() => null);
                    throw new Error(saveErr?.message || saveErr?.error || 'Error al guardar las condiciones finales.');
                }
            }

            // 2. Complete the ticket
            const res = await fetch(`${API_URL}/api/v1/tickets/${params.id}/complete/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket(updated);
                fetchTicketHistory();
                const successMsg = isClosureTicket
                    ? 'Inventario final completado. El administrador recibirá una notificación para aprobarlo.'
                    : 'Ticket marcado como completado. El administrador recibirá una notificación para aprobar la reparación.';
                await showAlert(successMsg, 'success');
            } else {
                const errData = await res.json().catch(() => null);
                await showAlert(errData?.message || errData?.error || 'Error al completar el ticket.', 'error');
            }
        } catch (err: any) {
            console.error('Error completing ticket:', err);
            await showAlert(err.message || 'Error de conexión.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">
                Cargando detalles del ticket...
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 p-6 rounded-3xl text-center max-w-xl mx-auto space-y-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p className="font-bold">{error || 'El ticket no está disponible.'}</p>
                <Link href="/dashboard/tickets" className="inline-block px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all">
                    Volver a tickets
                </Link>
            </div>
        );
    }

    // Dynamic color classes based on status
    const statusBadges = {
        DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30',
        ACCEPTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30',
        IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30',
        REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30',
        CLOSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30',
        PENDING_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30',
        PENDING_TENANT: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 border border-fuchsia-200/50 dark:border-fuchsia-900/30',
    };

    const priorityBadges = {
        LOW: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
        MEDIUM: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400',
        HIGH: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
    };

    // Timeline calculations
    const getTimeline = () => {
        if (!ticket) return [];
        const list = [
            {
                title: 'Abierto',
                date: new Date(ticket.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                desc: 'Ticket creado por el inquilino.',
                done: true,
            }
        ];

        if (ticket.status !== 'DRAFT' && ticket.status !== 'OPEN') {
            list.push({
                title: 'En proceso',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                desc: 'Soporte técnico asignado. Reparación en curso.',
                done: true,
            });
        }

        if (ticket.status === 'PENDING_ADMIN') {
            list.push({
                title: 'Revisión Administración',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                desc: 'Reparación realizada. Esperando visto bueno del administrador.',
                done: true,
            });
        } else if (ticket.status === 'PENDING_TENANT') {
            list.push({
                title: 'Confirmación Inquilino',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                desc: 'Visto bueno otorgado. Esperando confirmación de satisfacción del inquilino.',
                done: true,
            });
        } else if (ticket.status === 'CLOSED') {
            list.push({
                title: 'Cerrado',
                date: ticket.updated_at ? new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                desc: 'Reparación confirmada y ticket finalizado.',
                done: true,
            });
        }

        return list;
    };

    const timelineSteps = getTimeline();

    // Messages calculations
    const getMessages = () => {
        const msgs = [
            {
                sender: 'Admin',
                date: new Date(ticket.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                text: 'Hola, hemos recibido tu reporte. Estaremos revisándolo para programar una inspección técnica.',
                isAdmin: true
            }
        ];

        if (ticket.status !== 'DRAFT' && ticket.status !== 'OPEN') {
            msgs.push({
                sender: 'Soporte',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                text: 'Hemos asignado un técnico y la visita está programada. Una vez completado, confírmanos la solución.',
                isAdmin: true
            });
        }

        if (ticket.rejection_reason) {
            msgs.push({
                sender: 'Inquilino (Reporte de problema)',
                date: new Date(ticket.updated_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                text: ticket.rejection_reason,
                isAdmin: false
            });
        }

        return msgs;
    };

    const messages = getMessages();

    const isStaff = userRole === 'ADMIN' || userRole === 'ASSISTANT';
    const isTechnician = userRole === 'TECHNICIAN';

    // Acción requerida al inquilino: deshabilitado porque la aprobación admin es definitiva
    const showActionRequired = false;

    // Aprobación de cierre: solo admin/asistente, cuando el ticket es CLOSURE y está PENDING_ADMIN
    const showClosureApproval = isStaff && ticket.damage_type === 'CLOSURE' && ticket.status === 'PENDING_ADMIN';

    // Count technician's own attachments
    const techAttachments = ticket.attachments.filter(a => a.uploaded_by_detail?.role === 'TECHNICIAN');
    
    // Check if there are any unrated spaces for a closure ticket
    const hasUnratedClosureSpaces = ticket.damage_type === 'CLOSURE' && 
        (finalConditions.length === 0 || finalConditions.some(c => !c.condition));

    // Check if any space is missing photos for a closure ticket
    const missingPhotosForClosureSpaces = ticket.damage_type === 'CLOSURE' && 
        finalConditions.some(c => !ticket.attachments.some(a => a.space_name === c.space_name));

    const canComplete = isTechnician && 
        (ticket.damage_type === 'CLOSURE' 
            ? (!hasUnratedClosureSpaces && !missingPhotosForClosureSpaces) 
            : techAttachments.length > 0) && 
        (ticket.status === 'IN_PROGRESS' || ticket.status === 'ACCEPTED' || ticket.status === 'REJECTED' || ticket.status === 'OPEN');

    const getFullImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${API_URL}${path}`;
    };

    // History action icons
    const historyActionIcons: Record<string, string> = {
        CREATED: 'M12 4v16m8-8H4',
        STATUS_CHANGE: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        TECHNICIAN_ASSIGNED: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        ATTACHMENT_ADDED: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
        CONFIRMED: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        PROBLEM_REPORTED: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        COMPLETED_BY_TECHNICIAN: 'M5 13l4 4L19 7',
        CONTRACTOR_ASSIGNED: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5',
    };

    const historyActionColors: Record<string, string> = {
        CREATED: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        STATUS_CHANGE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        TECHNICIAN_ASSIGNED: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        ATTACHMENT_ADDED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        CONFIRMED: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        PROBLEM_REPORTED: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        COMPLETED_BY_TECHNICIAN: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        CONTRACTOR_ASSIGNED: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <nav className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Link href="/dashboard/tickets" className="hover:text-rose-600 transition-colors">Tickets</Link>
                        <span>&gt;</span>
                        <span className="text-slate-600 dark:text-slate-300">Detalle</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                            Ticket #{ticket.public_code || ticket.id.toString().padStart(5, '0')}
                        </h1>
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-tight rounded-xl ${statusBadges[ticket.status]}`}>
                            {ticket.status_display}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                    Imprimir
                </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Main Left Columns */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Problem Description Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-10 h-10 bg-rose-600 dark:bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {ticket.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                {ticket.description}
                            </p>
                        </div>
                    </div>

                    {/* Evidences Section */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                </svg>
                                Evidencias ({ticket.attachments.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {ticket.attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        onClick={() => setLightboxImage(getFullImageUrl(att.image_url))}
                                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-32 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group shadow-sm"
                                    >
                                        <img
                                            src={getFullImageUrl(att.image_url)}
                                            alt="Evidencia"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {att.uploaded_by_detail && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                                                <span className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${att.uploaded_by_detail.role === 'TECHNICIAN' ? 'bg-teal-500/90 text-white' : 'bg-white/90 text-slate-700'}`}>
                                                    {att.uploaded_by_detail.role === 'TECHNICIAN' ? '🔧 Técnico' : '📋 Inquilino'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Timeline */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                            Progreso
                        </h3>
                        <div className="relative pl-6 space-y-8 border-l border-slate-200 dark:border-slate-800">
                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    {/* Circle dot on line */}
                                    <span className="absolute -left-[31px] top-0.5 w-4.5 h-4.5 bg-rose-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-sm" />
                                    
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-baseline gap-2.5">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {step.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                                {step.date}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ticket History / Audit Trail */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Historial de Cambios
                        </h3>

                        {historyLoading ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium animate-pulse">
                                Cargando historial...
                            </div>
                        ) : ticketHistory.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                No hay eventos registrados aún.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {ticketHistory.map((entry) => (
                                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/50">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${historyActionColors[entry.action] || 'bg-slate-100 text-slate-500'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={historyActionIcons[entry.action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}></path>
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">
                                                    {entry.action_display}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                    {new Date(entry.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                                                {entry.description}
                                            </p>
                                            {(entry.old_value || entry.new_value) && (
                                                <div className="flex items-center gap-2 mt-1.5 text-[9px] font-bold">
                                                    {entry.old_value && (
                                                        <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded line-through">
                                                            {entry.old_value}
                                                        </span>
                                                    )}
                                                    {entry.old_value && entry.new_value && (
                                                        <span className="text-slate-300">→</span>
                                                    )}
                                                    {entry.new_value && (
                                                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded">
                                                            {entry.new_value}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {entry.created_by_detail && (
                                                <p className="text-[9px] text-slate-400 mt-1">
                                                    por {entry.created_by_detail.first_name} {entry.created_by_detail.last_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Messages Comments section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            Mensajes
                        </h3>
                        
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-2xl flex flex-col gap-1 text-xs ${
                                        msg.isAdmin
                                            ? 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60'
                                            : 'bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-950/20'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                            {msg.sender}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">{msg.date}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mt-1">
                                        {msg.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar Columns */}
                <div className="space-y-6">
                    
                    {/* Details Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                            Detalles
                        </h3>
                        <div className="space-y-3.5 text-xs font-semibold">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Estado</span>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${statusBadges[ticket.status]}`}>
                                    {ticket.status_display}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Prioridad</span>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${priorityBadges[ticket.priority]}`}>
                                    {ticket.priority_display}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Tipo</span>
                                <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-tight">
                                    {ticket.damage_type === 'OTHER' ? ticket.damage_type_other : ticket.damage_type_display}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Fecha de reporte</span>
                                <span className="text-slate-700 dark:text-slate-200 font-bold">
                                    {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                            {ticket.assigned_contractor_name && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">Contratista</span>
                                    <span className="text-slate-700 dark:text-slate-200 font-bold">
                                        {ticket.assigned_contractor_name}
                                    </span>
                                </div>
                            )}
                            {ticket.tenant_detail && (
                                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">Inquilino a cargo</span>
                                    <div className="pl-2 space-y-0.5">
                                        <div className="text-slate-700 dark:text-slate-200 font-bold">
                                            {ticket.tenant_detail.first_name} {ticket.tenant_detail.last_name}
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                                            {ticket.tenant_detail.email}
                                        </div>
                                        {ticket.tenant_detail.phone && (
                                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                                                Tel: {ticket.tenant_detail.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {ticket.assigned_technicians_detail && ticket.assigned_technicians_detail.length > 0 && (
                                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">Técnico asignado</span>
                                    <div className="flex flex-col gap-1 pl-2">
                                        {ticket.assigned_technicians_detail.map((tech) => (
                                            <span key={tech.id} className="text-slate-700 dark:text-slate-200 font-bold text-xs">
                                                • {tech.first_name} {tech.last_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technician Panel — Upload Evidence & Complete */}
                    {isTechnician && (ticket.status === 'IN_PROGRESS' || ticket.status === 'ACCEPTED' || ticket.status === 'REJECTED' || ticket.status === 'OPEN') && (
                        <div className="bg-teal-50/50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-900/50 rounded-3xl p-6 shadow-sm space-y-6">
                            {isClosureTicket && (
                                <div className="space-y-4 border-b border-teal-200/50 dark:border-teal-900/50 pb-6">
                                    <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400">
                                        <div className="w-9 h-9 bg-teal-600 dark:bg-teal-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-teal-600/20">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                                            </svg>
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest">
                                            Calificación Final de Espacios
                                        </h3>
                                    </div>
                                    
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        Califica el estado final de cada espacio del inmueble antes de marcar el ticket de cierre como completado.
                                    </p>

                                    {inventoryLoading ? (
                                        <p className="text-xs text-slate-450 animate-pulse font-semibold text-center py-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            Cargando espacios del inventario inicial...
                                        </p>
                                    ) : finalConditions && finalConditions.length > 0 ? (
                                        <div className="space-y-4">
                                            {!initialInventory && (
                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl px-3 py-2 font-semibold leading-relaxed">
                                                    ℹ No hay un inventario inicial registrado para este inmueble. Califica los espacios utilizando los ambientes sugeridos.
                                                </p>
                                            )}
                                            {finalConditions.map((cond, idx) => {
                                                const initialSpace = initialInventory?.spaces?.find(s => s.space_name === cond.space_name);
                                                return (
                                                    <div key={cond.space_name} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden group transition-all hover:border-slate-300 dark:hover:border-slate-700">
                                                        {/* Header Accordion */}
                                                        <div 
                                                            onClick={() => toggleTechnicianSpace(cond.space_name)}
                                                            className="p-5 flex items-center justify-between cursor-pointer border-b border-slate-150/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/10"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs leading-none">{cond.space_name}</h4>
                                                                    {initialSpace && (
                                                                        <span className="text-[9px] text-slate-400 font-bold block mt-1.5">
                                                                            Inicial: {initialSpace.condition_display}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isClosureTicket && (
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                                        ticket.attachments.some((a: any) => a.space_name === cond.space_name)
                                                                            ? 'bg-teal-50 text-teal-600 border border-teal-100 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/40'
                                                                            : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40 animate-pulse'
                                                                    }`}>
                                                                        {ticket.attachments.some((a: any) => a.space_name === cond.space_name)
                                                                            ? 'Con Foto'
                                                                            : 'Sin Foto'}
                                                                    </span>
                                                                )}
                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight ${
                                                                    cond.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600' :
                                                                    cond.condition === 'REGULAR' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                                }`}>
                                                                    {cond.condition === 'GOOD' ? 'Bueno' : cond.condition === 'REGULAR' ? 'Regular' : 'Malo'}
                                                                </span>
                                                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${openTechnicianSpaces[cond.space_name] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>

                                                        {/* Body Accordion */}
                                                        {openTechnicianSpaces[cond.space_name] && (
                                                            <div className="p-6 space-y-5">
                                                                {/* General Condition Selector */}
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado general</label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {[
                                                                            { value: 'GOOD', label: 'Bueno', activeColor: 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-md', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80' },
                                                                            { value: 'REGULAR', label: 'Regular', activeColor: 'bg-amber-500 text-white shadow-amber-500/20 shadow-md', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80' },
                                                                            { value: 'BAD', label: 'Malo', activeColor: 'bg-rose-600 text-white shadow-rose-600/20 shadow-md', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80' }
                                                                        ].map(opt => (
                                                                            <button
                                                                                key={opt.value}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const updated = [...finalConditions];
                                                                                    updated[idx].condition = opt.value as 'GOOD' | 'REGULAR' | 'BAD';
                                                                                    setFinalConditions(updated);
                                                                                }}
                                                                                className={`py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${cond.condition === opt.value ? opt.activeColor : opt.inactiveColor}`}
                                                                            >
                                                                                {opt.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Elements Checklist */}
                                                                <div className="space-y-3.5">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Elementos revisados</label>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {cond.items && cond.items.map((item, itemIdx) => (
                                                                            <label key={itemIdx} className="flex items-center gap-2.5 p-2.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-105 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700/80">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={item.checked}
                                                                                    onChange={(e) => {
                                                                                        const updated = [...finalConditions];
                                                                                        updated[idx].items[itemIdx].checked = e.target.checked;
                                                                                        setFinalConditions(updated);
                                                                                    }}
                                                                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                                                                                />
                                                                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Observations */}
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones adicionales</label>
                                                                    <textarea 
                                                                        value={cond.observations}
                                                                        onChange={(e) => {
                                                                            const updated = [...finalConditions];
                                                                            updated[idx].observations = e.target.value;
                                                                            setFinalConditions(updated);
                                                                        }}
                                                                        placeholder="Añade observaciones sobre este espacio..."
                                                                        rows={2}
                                                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-semibold focus:ring-1 focus:ring-teal-500/50 transition-all dark:text-white resize-none"
                                                                    />
                                                                </div>

                                                                {/* Space Specific Photos Upload */}
                                                                {isClosureTicket && (
                                                                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                                        <div className="flex justify-between items-center">
                                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evidencias del ambiente</label>
                                                                            <label className={`px-3 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${uploadingEvidence ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                                                                </svg>
                                                                                Subir Foto
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*"
                                                                                    onChange={(e) => handleTechnicianUpload(e, cond.space_name)}
                                                                                    className="hidden"
                                                                                    disabled={uploadingEvidence}
                                                                                />
                                                                            </label>
                                                                        </div>

                                                                        {ticket?.attachments.filter((a: any) => a.space_name === cond.space_name).length > 0 ? (
                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                {ticket.attachments.filter((a: any) => a.space_name === cond.space_name).map((att: any) => (
                                                                                    <div key={att.id} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative group border border-slate-200 dark:border-slate-800">
                                                                                        <img src={getFullImageUrl(att.image_url)} alt="evidencia" className="w-full h-full object-cover" />
                                                                                        {isTechnician && (ticket.status === 'IN_PROGRESS' || ticket.status === 'ACCEPTED' || ticket.status === 'REJECTED' || ticket.status === 'OPEN') && (
                                                                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleDeleteTechnicianAttachment(att.id)}
                                                                                                    className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg hover:scale-110 transition-transform"
                                                                                                >
                                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                                    </svg>
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100/60 dark:border-amber-900/30 flex items-center gap-1.5">
                                                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                                                                </svg>
                                                                                Falta imagen de evidencia para este ambiente.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold text-center bg-slate-100 dark:bg-slate-900 rounded-xl p-3">
                                            ℹ No hay un inventario inicial registrado para este inmueble. Calificar los espacios es opcional.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400">
                                <div className="w-9 h-9 bg-teal-600 dark:bg-teal-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-teal-600/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    {isClosureTicket ? 'Evidencias de Entrega por Ambiente' : 'Evidencias de Reparación'}
                                </h3>
                            </div>

                            <p className="text-xs text-slate-550 dark:text-slate-400 font-medium leading-relaxed">
                                {isClosureTicket 
                                    ? 'Por favor, asegúrate de adjuntar la evidencia fotográfica de cada espacio/ambiente en su respectiva sección arriba.'
                                    : 'Sube fotos del trabajo realizado como evidencia de la reparación. Debes subir al menos una imagen antes de poder marcar el ticket como completado.'
                                }
                            </p>

                            {!isClosureTicket && techAttachments.length > 0 && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    {techAttachments.length} evidencia{techAttachments.length > 1 ? 's' : ''} subida{techAttachments.length > 1 ? 's' : ''}
                                </div>
                            )}

                            {!isClosureTicket && (
                                <label className={`w-full py-2.5 bg-white dark:bg-slate-900 border-2 border-dashed border-teal-300 dark:border-teal-800 hover:border-teal-500 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${uploadingEvidence ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                    </svg>
                                    {uploadingEvidence ? 'Subiendo...' : 'Subir Evidencia'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleTechnicianUpload(e)}
                                        className="hidden"
                                        disabled={uploadingEvidence}
                                    />
                                </label>
                            )}

                            <button
                                type="button"
                                disabled={!canComplete || actionLoading}
                                onClick={handleTechnicianComplete}
                                className={`w-full py-2.5 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${canComplete ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20 cursor-pointer' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                </svg>
                                {actionLoading ? 'Procesando...' : 'Marcar como Completado'}
                            </button>

                            {!canComplete && !isClosureTicket && techAttachments.length === 0 && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-center">
                                    ⚠ Debes subir al menos una evidencia para completar
                                </p>
                            )}
                            {!canComplete && isClosureTicket && hasUnratedClosureSpaces && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-center">
                                    ⚠ Debes calificar todos los espacios del inventario antes de completar
                                </p>
                            )}
                            {!canComplete && isClosureTicket && !hasUnratedClosureSpaces && missingPhotosForClosureSpaces && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-center">
                                    ⚠ Debes subir al menos una evidencia fotográfica en cada uno de los ambientes arriba para poder completar
                                </p>
                            )}
                        </div>
                    )}

                    {/* Action Required Card (Tenant) */}
                    {showActionRequired && (
                        <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                <div className="w-9 h-9 bg-rose-600 dark:bg-rose-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    Confirmar Reparación
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Por favor confirma que la reparación se ha completado en tu inmueble para cerrar esta solicitud.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={handleConfirmRepair}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Confirmar Reparación Realizada
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Normal Ticket Admin Approval Panel — Only for admin/assistant on standard tickets in PENDING_ADMIN */}
                    {isStaff && ticket.damage_type !== 'CLOSURE' && ticket.status === 'PENDING_ADMIN' && (
                        <div className="bg-purple-50/60 dark:bg-purple-950/10 border-2 border-purple-400 dark:border-purple-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400">
                                <div className="w-9 h-9 bg-purple-600 dark:bg-purple-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    Revisión y Visto Bueno de Reparación
                                </h3>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                El soporte técnico ha marcado esta reparación como realizada. Por favor, verifica el trabajo (puedes revisar las evidencias adjuntas) y decide si otorgas el visto bueno o el visto malo.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={handleAdminApproveNormal}
                                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {actionLoading ? 'Procesando...' : 'Dar Visto Bueno (Aprobar)'}
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={handleAdminRejectNormal}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Dar Visto Malo (Rechazar)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Closure Approval Panel — Only for admin/assistant on CLOSURE tickets */}
                    {showClosureApproval && (
                        <div className="bg-amber-50/60 dark:bg-amber-950/10 border-2 border-amber-400 dark:border-amber-700 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                                <div className="w-9 h-9 bg-amber-600 dark:bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-600/20">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    Aprobación de Inventario Final
                                </h3>
                            </div>

                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100/60 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                                ⚠ Al aprobar, el contrato quedará cancelado y el inmueble pasará a estado disponible.
                            </p>

                            {/* Inventory comparison summary */}
                            {inventoryLoading ? (
                                <div className="py-4 text-center text-xs text-slate-400 animate-pulse font-medium">
                                    Cargando inventario inicial...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {initialInventory ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                    Inventario Inicial ({initialInventory.spaces.length} espacios)
                                                </p>
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {new Date(initialInventory.delivery_date).toLocaleDateString('es-ES')}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                {initialInventory.spaces.map((space) => (
                                                    <div key={space.id} className="flex items-center justify-between bg-white/80 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 border border-slate-100 dark:border-slate-800">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{space.space_name}</span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {space.photos.length > 0 && (
                                                                <span className="text-[9px] text-slate-400 font-bold">{space.photos.length}📷</span>
                                                            )}
                                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-lg ${
                                                                space.condition === 'GOOD' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                space.condition === 'REGULAR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                                                'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                                            }`}>
                                                                {space.condition_display}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 font-bold text-center py-2 bg-slate-100 dark:bg-slate-800/20 rounded-xl">
                                            No se encontró inventario inicial para este inmueble.
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowComparisonModal(true)}
                                        className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                                        </svg>
                                        {initialInventory ? 'Ver Comparativa Completa' : 'Ver Estado de Espacios'}
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmRepairAdmin}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                {actionLoading ? 'Procesando...' : 'Aprobar Inventario y Cerrar Contrato'}
                            </button>

                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleRejectClosureAdmin}
                                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer mt-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Rechazar Solicitud de Cierre
                            </button>
                        </div>
                    )}

                    {/* Admin Ticket Management */}
                    {isStaff && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-slate-800 dark:text-white">
                                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    Gestión del Ticket
                                </h3>
                            </div>
                            
                            <form onSubmit={handleAdminUpdate} className="space-y-4 pt-2">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                        Técnico Asignado
                                    </label>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 space-y-2">
                                        {technicians.map((t) => {
                                            const isChecked = selectedTechnicians.includes(t.id);
                                            return (
                                                <label key={t.id} className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            if (isChecked) {
                                                                setSelectedTechnicians([]);
                                                            } else {
                                                                setSelectedTechnicians([t.id]);
                                                            }
                                                        }}
                                                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 border-slate-300 dark:border-slate-700"
                                                    />
                                                    <span>{t.first_name} {t.last_name} ({t.email})</span>
                                                </label>
                                            );
                                        })}
                                        {technicians.length === 0 && (
                                            <p className="text-slate-400 text-xs italic">No hay técnicos registrados</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                        Contratista Asignado (Externo)
                                    </label>
                                    <input
                                        type="text"
                                        value={adminContractor}
                                        onChange={(e) => setAdminContractor(e.target.value)}
                                        placeholder="Ej. Juan Pérez (Plomero)"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-rose-500 transition-all text-slate-800 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </form>
                        </div>
                    )}

                </div>

            </div>

            {/* Lightbox / Modal for enlarged evidence images */}
            {lightboxImage && (
                <div
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
                >
                    <div className="max-w-4xl max-h-[85vh] relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
                        <img
                            src={lightboxImage}
                            alt="Lightbox"
                            className="max-w-full max-h-[85vh] object-contain select-none"
                        />
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-950/60 hover:bg-slate-950 text-white rounded-xl transition-colors border border-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Inventory Comparison Modal */}
            {showComparisonModal && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="w-full max-w-6xl my-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Comparativa de Inventario
                                </h2>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {initialInventory
                                        ? "Revisa el estado inicial vs. el estado final documentado por el técnico"
                                        : "Revisa el estado final de los espacios del inmueble registrado por el técnico"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowComparisonModal(false)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 text-slate-500 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body Wrapper (Single scroll container) */}
                        <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                            {/* SECTION 1: Summary Table of Conditions */}
                            <div className="px-8 py-6 bg-slate-50/[0.3] dark:bg-slate-900/[0.1]">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3.5">
                                    Resumen de Condiciones por Espacio
                                </h3>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60">
                                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Espacio</th>
                                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Condición Inicial</th>
                                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Condición Final</th>
                                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Observaciones del Técnico</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {((initialInventory ? initialInventory.spaces : (ticket?.final_space_conditions || [])) as any[]).map((spaceOrCond, idx) => {
                                                let spaceName = '';
                                                let initialCondition = '';
                                                let initialConditionDisplay = 'No registrado';
                                                let finalCond: any = null;

                                                if (initialInventory) {
                                                    spaceName = spaceOrCond.space_name;
                                                    initialCondition = spaceOrCond.condition;
                                                    initialConditionDisplay = spaceOrCond.condition_display;
                                                    finalCond = ticket?.final_space_conditions?.find(
                                                        (c: any) => c.space_name?.toLowerCase() === spaceName.toLowerCase()
                                                    );
                                                } else {
                                                    spaceName = spaceOrCond.space_name;
                                                    initialCondition = '';
                                                    initialConditionDisplay = 'No registrado';
                                                    finalCond = spaceOrCond;
                                                }

                                                const worsened = (initialInventory && finalCond) ? didConditionWorsen(initialCondition, finalCond.condition) : false;
                                                
                                                // Highlight row with red gradient if worsened
                                                const rowClass = worsened
                                                    ? "bg-gradient-to-r from-rose-500/[0.06] to-rose-500/[0.01] dark:from-rose-950/20 dark:to-transparent"
                                                    : "hover:bg-slate-50/50 dark:hover:bg-slate-800/10";
                                                    
                                                return (
                                                    <tr key={spaceOrCond.id || idx} className={`${rowClass} transition-colors`}>
                                                        <td className="px-6 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                            <div className="flex items-center gap-2">
                                                                {spaceName}
                                                                {worsened && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-600/10">
                                                                        Empeoró
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            {initialInventory ? (
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                                    initialCondition === 'GOOD' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                                                    initialCondition === 'REGULAR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                                                    'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                                                }`}>
                                                                    {initialConditionDisplay}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                                    No registrado
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3.5">
                                                            {finalCond ? (
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                                    finalCond.condition === 'GOOD' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                                                    finalCond.condition === 'REGULAR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                                                    'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                                                }`}>
                                                                    {finalCond.condition_display || (finalCond.condition === 'GOOD' ? 'Bueno' : finalCond.condition === 'REGULAR' ? 'Regular' : 'Malo')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                            {finalCond?.observations || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Column Headers for Photo Comparison */}
                            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
                                <div className="px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
                                            Fotos Iniciales por Espacio
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold ml-auto">
                                            {initialInventory ? new Date(initialInventory.delivery_date).toLocaleDateString('es-ES') : 'No registrado'}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-teal-50/50 dark:bg-teal-950/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
                                            Evidencias Finales del Técnico
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold ml-auto">
                                            {techAttachments.length} foto{techAttachments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Photos Comparison Grid */}
                            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
                                {/* LEFT: Initial Inventory Spaces */}
                                <div className="p-6 space-y-5">
                                    {initialInventory && initialInventory.observations && (
                                        <div className="bg-indigo-50/60 dark:bg-indigo-950/10 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/30">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-1">Observaciones generales</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{initialInventory.observations}</p>
                                        </div>
                                    )}
                                    {!initialInventory ? (
                                        <div className="text-center py-12 space-y-2 bg-indigo-50/30 dark:bg-indigo-950/5 rounded-3xl border border-dashed border-indigo-100 dark:border-indigo-900/20">
                                            <p className="text-xs text-slate-400 font-medium px-4">
                                                No hay un inventario inicial registrado para este inmueble. Los espacios listados arriba corresponden a la calificación final realizada por el técnico.
                                            </p>
                                        </div>
                                    ) : initialInventory.spaces.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-8 font-medium">Sin espacios registrados</p>
                                    ) : (
                                        initialInventory.spaces.map((space) => (
                                            <div key={space.id} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight flex-1">{space.space_name}</h4>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                                        space.condition === 'GOOD' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                        space.condition === 'REGULAR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                    }`}>
                                                        {space.condition_display}
                                                    </span>
                                                </div>
                                                {space.observations && (
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 py-2">
                                                        {space.observations}
                                                    </p>
                                                )}
                                                {space.photos.length > 0 ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {space.photos.map((photo) => (
                                                            <div
                                                                key={photo.id}
                                                                onClick={() => setLightboxImage(getFullImageUrl(photo.image_url))}
                                                                className="relative rounded-xl overflow-hidden h-20 cursor-pointer group border border-slate-200 dark:border-slate-700 hover:scale-[1.03] transition-all shadow-sm"
                                                            >
                                                                <img
                                                                    src={getFullImageUrl(photo.thumbnail_url || photo.image_url)}
                                                                    alt={photo.description || space.space_name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-all" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[9px] text-slate-300 dark:text-slate-655 font-bold italic">Sin fotos</p>
                                                )}
                                                <div className="border-b border-dashed border-slate-100 dark:border-slate-800" />
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* RIGHT: Technician's Final Evidence */}
                                <div className="p-6 space-y-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                        Fotografías subidas por el técnico como evidencia del estado final del inmueble.
                                    </p>
                                    {techAttachments.length === 0 ? (
                                        <div className="text-center py-12 space-y-2">
                                            <svg className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            </svg>
                                            <p className="text-xs text-slate-400 font-medium">Sin evidencias del técnico aún</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {techAttachments.map((att, idx) => (
                                                <div
                                                    key={att.id}
                                                    onClick={() => setLightboxImage(getFullImageUrl(att.image_url))}
                                                    className="relative rounded-2xl overflow-hidden h-36 cursor-pointer group border border-teal-200/50 dark:border-teal-900/40 hover:scale-[1.02] transition-all shadow-sm"
                                                >
                                                    <img
                                                        src={getFullImageUrl(att.image_url)}
                                                        alt={`Evidencia técnico ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal-900/50 to-transparent p-2">
                                                        <span className="text-[9px] text-white font-bold">Evidencia {idx + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer with Approve Button */}
                        <div className="flex items-center justify-between gap-4 px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                            <button
                                onClick={() => setShowComparisonModal(false)}
                                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => { setShowComparisonModal(false); handleConfirmRepairAdmin(); }}
                                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                {actionLoading ? 'Procesando...' : 'Aprobar y Cerrar Contrato'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Admin Rejection Reason Modal */}
            {showRevertModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-6">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Rechazar Solicitud
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                {ticket?.damage_type === 'CLOSURE' 
                                    ? 'Por favor ingresa el motivo detallado de por qué se rechaza esta solicitud de cierre de contrato. Esto será visible en el historial.'
                                    : 'Por favor ingresa el motivo del rechazo de la reparación. Esto devolverá el ticket a "En proceso" para el técnico.'}
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Motivo del Rechazo *
                            </label>
                            <textarea
                                value={rejectionModalText}
                                onChange={(e) => setRejectionModalText(e.target.value)}
                                placeholder="Escribe el motivo detallado aquí..."
                                rows={4}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-500 transition-all text-slate-800 dark:text-white resize-none"
                            />
                        </div>
                        
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRevertModal(false);
                                    setRejectionModalText('');
                                }}
                                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isRejectionSubmitting || !rejectionModalText.trim()}
                                onClick={handleAdminRejectSubmit}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-350 dark:disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/20"
                            >
                                {isRejectionSubmitting ? 'Procesando...' : 'Rechazar Solicitud'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

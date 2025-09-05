import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Reservation } from '@/types';
import { format } from 'date-fns';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, User, Scissors, Phone, History, Search, Filter, Download } from 'lucide-react';

interface ReservationHistoryProps {
    reservations: Reservation[];
    isLoading: boolean;
    onStatusUpdate: (id: string, status: Reservation['status']) => void;
    userRole?: string;
}

const ReservationHistory: React.FC<ReservationHistoryProps> = ({
    reservations,
    isLoading,
    onStatusUpdate,
    userRole
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Get all reservations (including completed and cancelled) for history
    const allReservations = React.useMemo(() =>
        reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [reservations]
    );

    // Filter reservations based on search and filters
    const filteredReservations = React.useMemo(() => {
        let filtered = allReservations;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.clientPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.barberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.services || []).some(s => s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    filtered = filtered.filter(r => {
                        const resDate = new Date(r.date);
                        resDate.setHours(0, 0, 0, 0);
                        return resDate.getTime() === filterDate.getTime();
                    });
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    filtered = filtered.filter(r => new Date(r.date) >= filterDate);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    filtered = filtered.filter(r => new Date(r.date) >= filterDate);
                    break;
                case 'quarter':
                    filterDate.setMonth(now.getMonth() - 3);
                    filtered = filtered.filter(r => new Date(r.date) >= filterDate);
                    break;
            }
        }

        return filtered;
    }, [allReservations, searchTerm, statusFilter, dateFilter]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const paginatedReservations = filteredReservations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Statistics for filtered results
    const historyStats = React.useMemo(() => ({
        total: filteredReservations.length,
        completed: filteredReservations.filter(r => r.status === 'completed').length,
        cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
        confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
        pending: filteredReservations.filter(r => r.status === 'pending').length,
        totalRevenue: filteredReservations
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + (r.totalPrice || 0), 0),
    }), [filteredReservations]);

    const getStatusBadgeVariant = (status: Reservation['status']) => {
        switch (status) {
            case 'confirmed': return 'default';
            case 'pending': return 'secondary';
            case 'cancelled': return 'destructive';
            case 'completed': return 'outline';
            default: return 'secondary';
        }
    };

    const getStatusIcon = (status: Reservation['status']) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <AlertCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Time', 'Client', 'Phone', 'Barber', 'Services', 'Status', 'Price'];
        const csvData = filteredReservations.map(r => [
            format(new Date(r.date), 'yyyy-MM-dd'),
            r.startTime,
            r.clientName,
            r.clientPhone || '',
            r.barberName,
            (r.services || []).map(s => s.serviceName).join('; '),
            r.status,
            r.totalPrice || 0
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservation-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <History className="w-5 h-5" />
                        <span>Loading History...</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <History className="w-5 h-5" />
                                <span>Reservation History</span>
                            </CardTitle>
                            <CardDescription>
                                Complete history of all reservations with filtering and search
                            </CardDescription>
                        </div>
                        <Button onClick={exportToCSV} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{historyStats.total}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{historyStats.completed}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{historyStats.confirmed}</div>
                            <div className="text-xs text-muted-foreground">Confirmed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{historyStats.cancelled}</div>
                            <div className="text-xs text-muted-foreground">Cancelled</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">${historyStats.totalRevenue.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search client, phone, barber..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">Last 7 Days</SelectItem>
                                <SelectItem value="month">Last Month</SelectItem>
                                <SelectItem value="quarter">Last 3 Months</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-muted-foreground flex items-center">
                            <Filter className="w-4 h-4 mr-2" />
                            {filteredReservations.length} of {allReservations.length} records
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredReservations.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No reservations found matching your criteria</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Client Info</TableHead>
                                            <TableHead>Barber</TableHead>
                                            <TableHead>Services</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Price</TableHead>
                                            {userRole === 'admin' && <TableHead>Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedReservations.map((reservation, index) => {
                                            const reservationId = reservation._id || reservation.id;
                                            return (
                                                <TableRow key={`history-${reservationId}-${index}`}>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm">
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {format(new Date(reservation.date), 'MMM d, yyyy')}
                                                            </div>
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Clock className="w-4 h-4 mr-2" />
                                                                {reservation.startTime} - {reservation.endTime}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center text-sm font-medium">
                                                                <User className="w-4 h-4 mr-2" />
                                                                {reservation.clientName}
                                                            </div>
                                                            {reservation.clientPhone && (
                                                                <div className="flex items-center text-sm text-muted-foreground">
                                                                    <Phone className="w-4 h-4 mr-2" />
                                                                    {reservation.clientPhone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Scissors className="w-4 h-4 mr-2" />
                                                            {reservation.barberName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {reservation.services && reservation.services.length > 0 ? (
                                                                reservation.services.map((service, idx) => (
                                                                    <div key={idx} className="text-sm">
                                                                        <span className="font-medium">{service.serviceName}</span>
                                                                        <span className="text-muted-foreground ml-2">
                                                                            ({service.duration}min, ${service.price})
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">No services specified</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusBadgeVariant(reservation.status)} className="flex w-fit items-center gap-1">
                                                            {getStatusIcon(reservation.status)}
                                                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            ${(reservation.totalPrice || 0).toFixed(2)}
                                                        </div>
                                                    </TableCell>
                                                    {userRole === 'admin' && (
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {reservation.status === 'pending' && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="default"
                                                                            onClick={() => onStatusUpdate(reservationId, 'confirmed')}
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                                            Confirm
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => onStatusUpdate(reservationId, 'cancelled')}
                                                                        >
                                                                            <XCircle className="w-4 h-4 mr-1" />
                                                                            Cancel
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {reservation.status === 'confirmed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => onStatusUpdate(reservationId, 'completed')}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                                        Complete
                                                                    </Button>
                                                                )}
                                                                {['completed', 'cancelled'].includes(reservation.status) && (
                                                                    <span className="text-sm text-muted-foreground">No actions</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of {filteredReservations.length} results
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReservationHistory;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import WeeklyCalendar from '@/components/Calendar/WeeklyCalendar';
import { Reservation, Service, UiTimeSlot, UiBarber } from '@/types';
import { reservationsService } from '@/api/reservationsApi';
import { servicesApi, CreateServiceData, UpdateServiceData } from '@/api/servicesApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, User, Scissors, Phone, History, Search, Filter, Download } from 'lucide-react';
import ServiceModal from '@/components/services/ServiceModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
// Import centralized barber configuration for consistency
import { BARBERS } from '@/config/barbers';

// Reservation History Component
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

const Dashboard: React.FC = () => {
  // -----------------------
  // State Management
  // -----------------------
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Memoized calendar data - FIXED VERSION
  const { calendarSlots, barbers } = React.useMemo(() => {
    console.log('Dashboard: Generating calendar data from reservations:', reservations);
    
    // Create barbers list from centralized config, filtered by those with reservations
    const reservationBarberNames = [...new Set(reservations.map(r => r.barberName))];
    const uniqueBarbers: UiBarber[] = BARBERS.filter(barber => 
      reservationBarberNames.includes(barber.name)
    );

    // Create calendar slots - PRESERVE ORIGINAL STATUS
    const slots: UiTimeSlot[] = reservations.map(r => {
      console.log('Dashboard: Processing reservation:', {
        id: r._id || r.id,
        barberName: r.barberName,
        date: r.date,
        startTime: r.startTime,
        status: r.status
      });

      // Parse date in local time to fix off-by-one day issue
      const [year, month, day] = r.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);

      return {
        id: r._id || r.id,
        barberId: r.barberName,
        date: localDate,
        startTime: r.startTime,
        endTime: r.endTime || `${parseInt(r.startTime.split(':')[0]) + 1}:00`,
        isAvailable: r.status === 'cancelled', // Only cancelled slots are truly available
        status: r.status, // KEEP THE ORIGINAL STATUS - THIS IS CRUCIAL
        services: (r.services || []).map(s => ({
          id: s.serviceId,
          name: s.serviceName,
          duration: s.duration || 30,
          price: s.price || 0,
          isActive: true
        }))
      };
    });

    console.log('Dashboard: Generated calendar slots:', slots);

    return {
      calendarSlots: slots,
      barbers: uniqueBarbers
    };
  }, [reservations, lastUpdate]); // Include lastUpdate to force refresh

  const openCreateModal = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'user')) {
      fetchReservations();
      if (user.role === 'admin') fetchServices();
    }
  }, [user]);

  // -----------------------------
  // Reservations
  // -----------------------------
  const fetchReservations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      
      const params = user.role === 'admin' ? {} : { clientId: user.id };
      const fetchedReservations = await reservationsService.getReservations(params);
      
      const validReservations = (fetchedReservations || []).map(res => ({
        ...res,
        id: res._id || res.id
      }));

      console.log('Dashboard: Fetched reservations:', validReservations);

      // Update reservations and force a calendar refresh
      const isDifferent = JSON.stringify(reservations) !== JSON.stringify(validReservations);
      if (isDifferent) {
        console.log('Dashboard: Reservations changed, updating state');
        setReservations(validReservations);
        setLastUpdate(Date.now()); // Force calendar refresh
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      toast({ title: "Error", description: "Failed to load reservations", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, reservations]);

  const handleStatusUpdate = async (reservationId: string, newStatus: Reservation['status']) => {
    if (!reservationId) {
      console.error('Attempted to update reservation with no ID');
      toast({ 
        title: "Error", 
        description: "Invalid reservation ID", 
        variant: "destructive" 
      });
      return;
    }

    console.log('Dashboard: Updating reservation status:', { reservationId, newStatus });

    try {
      // Optimistically update the local state first
      setReservations(prev =>
        prev.map(res => {
          const currentId = res._id || res.id;
          return currentId === reservationId 
            ? { ...res, status: newStatus }
            : res;
        })
      );

      // Force calendar update immediately
      setLastUpdate(Date.now());

      // Make the API call
      const updatedReservation = await reservationsService.updateReservationStatus(reservationId, newStatus);
      
      if (updatedReservation) {
        console.log('Dashboard: Status update successful, fetching fresh data');
        // Fetch fresh data to ensure everything is in sync
        await fetchReservations();
        
        toast({ 
          title: "Status Updated", 
          description: `Reservation has been marked as ${newStatus}` 
        });
        
        // Force another state update to ensure calendar refreshes
        setLastUpdate(Date.now());
      } else {
        throw new Error('No reservation data received from update');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update reservation status";
      console.error('Error updating reservation status:', {
        error,
        reservationId,
        newStatus
      });
      
      // Revert the optimistic update
      await fetchReservations();
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  // Set up periodic refresh
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      console.log('Dashboard: Periodic refresh triggered');
      fetchReservations();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user, fetchReservations]);

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

  // Calculate statistics from all reservations
  const stats = React.useMemo(() => ({
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    totalRevenue: reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0),
    usageRate: reservations.length > 0 
      ? (reservations.filter(r => ['completed', 'confirmed'].includes(r.status)).length / reservations.length) * 100 
      : 0
  }), [reservations]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get active reservations (not completed or cancelled) for display
  const activeReservations = React.useMemo(() => 
    reservations
      .filter(r => !['completed', 'cancelled'].includes(r.status))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [reservations]
  );

  // Calculate pagination
  const totalPages = Math.ceil(activeReservations.length / itemsPerPage);
  const paginatedReservations = activeReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // -----------------------------
  // Services
  // -----------------------------
  const fetchServices = async () => {
    setServiceLoading(true);
    try {
      const response = await servicesApi.getServices();
      setServices(response);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
    } finally {
      setServiceLoading(false);
    }
  };

  const handleSaveService = async (serviceData: Partial<CreateServiceData & UpdateServiceData>) => {
    try {
      console.log('Dashboard: Saving service:', { selectedService, serviceData });
      
      if (selectedService) {
        await servicesApi.updateService(selectedService.id, serviceData);
        toast({ title: "Success", description: "Service updated successfully" });
      } else {
        await servicesApi.createService(serviceData as CreateServiceData);
        toast({ title: "Success", description: "Service created successfully" });
      }
      
      // Refresh services list and close modal
      await fetchServices();
      closeModal();
    } catch (error: any) {
      console.error('Dashboard: Service save error:', error);
      
      // Show specific error message from API
      const errorMessage = error.message || 'Failed to save service';
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!serviceId) return;
    
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('Dashboard: Deleting service:', serviceId);
      await servicesApi.deleteService(serviceId);
      await fetchServices(); // Refresh the list
      toast({ title: "Deleted", description: "Service deleted successfully" });
    } catch (error: any) {
      console.error('Dashboard: Service delete error:', error);
      
      // Show specific error message
      const errorMessage = error.message || 'Failed to delete service';
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'user')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You don't have permission to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{user.role === 'admin' ? 'Admin Dashboard' : 'Barber Dashboard'}</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground">Ready to serve</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Successfully served</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reservations">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <div className="flex justify-end mb-4">
              <Button onClick={openCreateModal}>Add Service</Button>
            </div>
            {serviceLoading ? (
              <p>Loading services...</p>
            ) : services.length === 0 ? (
              <p>No services found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow key={`service-${service.id}-${index}`}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.duration} mins</TableCell>
                      <TableCell>${service.price}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => openEditModal(service)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <ReservationHistory 
              reservations={reservations}
              isLoading={isLoading}
              onStatusUpdate={handleStatusUpdate}
              userRole={user?.role}
            />
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            {isLoading ? (
              <p>Loading reservations...</p>
            ) : activeReservations.length === 0 ? (
              <p>No active reservations found</p>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing active reservations ({activeReservations.length} total)
                  </div>
                  <div className="text-sm font-medium">
                    Usage Rate: {stats.usageRate.toFixed(1)}% | 
                    Revenue: ${stats.totalRevenue.toFixed(2)}
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReservations
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .filter(reservation => {
                      const hasId = reservation._id || reservation.id;
                      if (!hasId) {
                        console.error('Reservation without ID:', JSON.stringify(reservation, null, 2));
                        return false;
                      }
                      return true;
                    })
                    .map((reservation, index) => {
                      const reservationId = reservation._id || reservation.id;
                      return (
                        <TableRow key={`reservation-${reservationId}-${index}`}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {format(new Date(reservation.date), 'PPP')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {reservation.startTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {reservation.clientName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {reservation.clientPhone || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Scissors className="w-4 h-4 mr-2" />
                              {reservation.services && reservation.services.length > 0
                                ? reservation.services.map(s => s.serviceName).join(', ')
                                : 'No service specified'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(reservation.status)} className="flex w-fit items-center gap-1">
                              {getStatusIcon(reservation.status)}
                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </Badge>
                          </TableCell>
                          {user?.role === 'admin' && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {reservation.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleStatusUpdate(reservationId, 'confirmed')}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleStatusUpdate(reservationId, 'cancelled')}
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
                                    onClick={() => handleStatusUpdate(reservationId, 'completed')}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Complete
                                  </Button>
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
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">Calendar Debug Info:</h3>
              <p className="text-sm text-muted-foreground">
                Total Reservations: {reservations.length} | 
                Calendar Slots: {calendarSlots.length} | 
                Last Update: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
              <div className="mt-2">
                <p className="text-xs">Recent Reservations Status:</p>
                {reservations.slice(0, 3).map(r => (
                  <p key={r._id || r.id} className="text-xs">
                    {r.barberName} - {r.startTime} - Status: {r.status}
                  </p>
                ))}
              </div>
            </div>
            <WeeklyCalendar 
              key={`calendar-${lastUpdate}-${JSON.stringify(reservations.map(r => ({id: r._id || r.id, status: r.status})))}`}
              timeSlots={calendarSlots}
              barbers={barbers}
              onSlotClick={() => {}}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Service Modal */}
        <ServiceModal 
          open={modalOpen} 
          onClose={closeModal} 
          service={selectedService} 
          onSave={handleSaveService} 
        />
      </div>
    </div>
  );
};

export default Dashboard;

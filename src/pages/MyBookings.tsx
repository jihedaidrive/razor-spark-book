import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Reservation } from '@/types';
import { reservationsService } from '@/api/reservationsApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Scissors, 
  Phone, 
  History, 
  Search, 
  Filter,
  Star,
  MapPin,
  Download,
  RefreshCw
} from 'lucide-react';

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchMyReservations();
    }
  }, [user]);

  // Add periodic refresh to keep data up to date
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(() => {
      console.log('MyBookings: Periodic refresh triggered');
      fetchMyReservations();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user]);

  const fetchMyReservations = async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      
      // Fetch reservations for the current user using clientId
      const params = { 
        clientId: user.id, // Use the user's ID for proper filtering
        clientName: user.name, // Also include name as fallback
        clientPhone: user.phone // Also include phone as fallback
      };
      
      console.log('MyBookings: Fetching reservations for user:', params);
      
      const fetchedReservations = await reservationsService.getReservations(params);
      
      console.log('MyBookings: Fetched reservations:', fetchedReservations);
      
      let validReservations = (fetchedReservations || []).map(res => ({
        ...res,
        id: res._id || res.id
      }));

      // If no reservations found with clientId, try filtering by name and phone
      if (validReservations.length === 0) {
        console.log('MyBookings: No reservations found with clientId, trying name/phone filter');
        try {
          const fallbackParams = { 
            clientName: user.name,
            clientPhone: user.phone
          };
          const fallbackReservations = await reservationsService.getReservations(fallbackParams);
          
          // Filter client-side by name and phone to ensure we only get user's reservations
          validReservations = (fallbackReservations || [])
            .filter(res => 
              res.clientName === user.name || 
              res.clientPhone === user.phone
            )
            .map(res => ({
              ...res,
              id: res._id || res.id
            }));
          
          console.log('MyBookings: Fallback reservations found:', validReservations.length);
        } catch (fallbackError) {
          console.error('MyBookings: Fallback fetch failed:', fallbackError);
        }
      }

      setReservations(validReservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error: any) {
      console.error('Failed to fetch my reservations:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Failed to load your booking history";
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
      
      // Set empty array on error to show empty state
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reservations based on search and filters
  const filteredReservations = React.useMemo(() => {
    let filtered = reservations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.barberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.services || []).some(s => s.serviceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
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
        case 'upcoming':
          filtered = filtered.filter(r => new Date(r.date) >= now);
          break;
        case 'past':
          filtered = filtered.filter(r => new Date(r.date) < now);
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
  }, [reservations, searchTerm, statusFilter, dateFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics for user's bookings
  const myStats = React.useMemo(() => ({
    total: reservations.length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending: reservations.filter(r => r.status === 'pending').length,
    totalSpent: reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0),
    upcomingBookings: reservations.filter(r => 
      new Date(r.date) >= new Date() && ['confirmed', 'pending'].includes(r.status)
    ).length
  }), [reservations]);

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

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const exportMyBookings = () => {
    const headers = ['Date', 'Time', 'Barber', 'Services', 'Status', 'Price', 'Notes'];
    const csvData = filteredReservations.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.startTime,
      r.barberName,
      (r.services || []).map(s => s.serviceName).join('; '),
      r.status,
      r.totalPrice || 0,
      r.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please login to view your booking history.</p>
            <Button asChild className="w-full">
              <a href="/login">Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Loading Your Bookings...</span>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">My Booking History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track all your appointments and bookings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{myStats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{myStats.completed}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{myStats.upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Star className="h-4 w-4 mr-2 text-primary" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-primary">${myStats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Lifetime</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Booking History</span>
                </CardTitle>
                <CardDescription>
                  View and search through all your appointments
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={fetchMyReservations} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={exportMyBookings} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search barber, service..."
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
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                {filteredReservations.length} of {reservations.length} bookings
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {reservations.length === 0 
                    ? "You haven't made any bookings yet" 
                    : "No bookings found matching your criteria"
                  }
                </p>
                {reservations.length === 0 && (
                  <Button asChild className="mt-4">
                    <a href="/booking">Book Your First Appointment</a>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Barber</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden sm:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReservations.map((reservation, index) => {
                        const reservationId = reservation._id || reservation.id;
                        const isUpcoming = new Date(reservation.date) >= new Date();
                        
                        return (
                          <TableRow key={`my-booking-${reservationId}-${index}`}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm font-medium">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {format(new Date(reservation.date), 'MMM d, yyyy')}
                                  {isUpcoming && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Upcoming
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4 mr-2" />
                                  {reservation.startTime} - {reservation.endTime}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Scissors className="w-4 h-4 mr-2" />
                                <span className="font-medium">{reservation.barberName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {reservation.services && reservation.services.length > 0 ? (
                                  reservation.services.map((service, idx) => (
                                    <div key={idx} className="text-sm">
                                      <span className="font-medium">{service.serviceName}</span>
                                      <div className="text-xs text-muted-foreground">
                                        {service.duration}min • ${service.price}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No services specified</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={getStatusBadgeVariant(reservation.status)} 
                                className={`flex w-fit items-center gap-1 ${getStatusColor(reservation.status)}`}
                              >
                                {getStatusIcon(reservation.status)}
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ${(reservation.totalPrice || 0).toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {reservation.notes || 'No notes'}
                              </div>
                            </TableCell>
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of {filteredReservations.length} bookings
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
    </div>
  );
};

export default MyBookings;
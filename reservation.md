import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservation.dto';
import { Reservation } from './schema/reservation.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);

  constructor(private readonly reservationService: ReservationService) {}

  private logUser(req: any) {
    this.logger.debug('Incoming request headers: ' + JSON.stringify(req.headers));
    this.logger.debug('User object from JWT: ' + JSON.stringify(req.user));
  }

  // 🔍 DEBUG ENDPOINT - Add this temporarily to test JWT
  @Get('debug/auth')
  @UseGuards(AuthGuard('jwt'))
  async debugAuth(@Request() req): Promise<any> {
    this.logger.debug('🔍 DEBUG: Auth test endpoint hit');
    this.logger.debug('🔍 DEBUG: Headers:', JSON.stringify(req.headers));
    this.logger.debug('🔍 DEBUG: User:', JSON.stringify(req.user));
    
    return {
      success: true,
      user: req.user,
      message: 'JWT Authentication is working!',
      timestamp: new Date().toISOString()
    };
  }

  // Create a reservation (authenticated users only)
  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateReservationDto, @Request() req): Promise<Reservation> {
    this.logUser(req);
    console.log('✅ ReservationController.createReservation hit');
    console.log('👤 Authenticated user:', req.user);

    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }
    const clientId = req.user?.sub || req.user?.id;
    this.logger.debug('Resolved clientId: ' + clientId);
    return this.reservationService.createReservation(dto, clientId);
  }

  // Get all reservations (admins see all, users see their own)
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req, @Query() query: Partial<Reservation>): Promise<Reservation[]> {
    this.logUser(req);
    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }

    const clientId = req.user.role === 'admin' ? undefined : req.user?.sub || req.user?.id;
    this.logger.debug('Resolved clientId for query: ' + clientId);

    return this.reservationService.getReservations(clientId, query);
  }

  // Update a reservation by id (authenticated)
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @Request() req,
  ): Promise<Reservation> {
    this.logUser(req);
    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }

    return this.reservationService.updateReservation(id, dto);
  }

  // Delete a reservation by id (authenticated)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    this.logUser(req);
    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }

    return this.reservationService.deleteReservation(id);
  }
} 
//////////////////////////////////////////////////////
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schema/reservation.schema';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservation.dto';
import { Service, ServiceDocument } from '../service/schema/service.schema';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private readonly BARBERS = ['John', 'Mike', 'Alex'];

  constructor(
    @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  // Create a reservation and assign authenticated user as client
  async createReservation(dto: CreateReservationDto, userId: string): Promise<Reservation> {
    this.logger.debug('🔍 Creating reservation for userId:', userId);
    this.logger.debug('📝 Reservation data:', JSON.stringify(dto));

    // 1️⃣ Validate barber
    if (!this.BARBERS.includes(dto.barberName)) {
      throw new BadRequestException(`Barber "${dto.barberName}" does not exist.`);
    }

    // 2️⃣ Validate date (cannot be in the past)
    const now = new Date();
    const reservationDate = new Date(dto.date);
    if (reservationDate < new Date(now.setHours(0, 0, 0, 0))) {
      throw new BadRequestException('You cannot book a reservation in the past.');
    }

    // 3️⃣ Handle serviceIds (must have at least one)
    let serviceIds: string[] = [];
    if (dto.serviceId) {
      serviceIds = [dto.serviceId];
    } else if (dto.serviceIds && dto.serviceIds.length > 0) {
      serviceIds = dto.serviceIds;
    } else {
      throw new BadRequestException('At least one service must be specified (serviceId or serviceIds).');
    }

    this.logger.debug('🔍 Processing services:', serviceIds);

    // 4️⃣ Fetch services
    const services = await this.serviceModel.find({ _id: { $in: serviceIds } });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more selected services do not exist.');
    }

    // 5️⃣ Calculate total duration & end time
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

    const [hours, minutes] = dto.startTime.split(':').map(Number);
    const startDate = new Date(reservationDate);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + totalDuration * 60000);
    const endTime = endDate.toTimeString().slice(0, 5); // "HH:MM"

    // 6️⃣ Ensure logical time range
    if (endDate <= startDate) {
      throw new BadRequestException('End time must be after start time.');
    }

    // 7️⃣ Prevent overlapping reservations for the same barber
    const overlap = await this.reservationModel.findOne({
      barberName: dto.barberName,
      date: reservationDate,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: dto.startTime },
        },
      ],
      status: { $in: ['pending', 'confirmed'] }, // block only active reservations
    });

    if (overlap) {
      throw new BadRequestException('This time slot is already booked for the selected barber.');
    }

    // 8️⃣ Prepare reservation data
    const serviceDetails = services.map(service => ({
      serviceId: service._id,
      serviceName: service.name,
      duration: service.duration,
      price: service.price,
    }));

    const reservationData = {
      clientId: new Types.ObjectId(userId),
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      serviceIds: serviceIds.map(id => new Types.ObjectId(id)),
      services: serviceDetails,
      barberName: dto.barberName,
      date: reservationDate,
      startTime: dto.startTime,
      endTime,
      status: 'pending' as const,
      notes: dto.notes,
      totalDuration,
      totalPrice,
    };

    this.logger.debug('💾 Saving reservation:', JSON.stringify(reservationData));

    const reservation = new this.reservationModel(reservationData);
    return reservation.save();
  }

  // Get reservations (filter by clientId for regular users)
  async getReservations(clientId?: string, filters?: Partial<Reservation>): Promise<Reservation[]> {
    const query: any = { ...filters };
    
    if (clientId) {
      query.clientId = new Types.ObjectId(clientId);
      this.logger.debug('🔍 Querying reservations for clientId:', clientId);
    } else {
      this.logger.debug('🔍 Querying all reservations (admin view)');
    }
    
    const reservations = await this.reservationModel.find(query).exec();
    this.logger.debug(`📋 Found ${reservations.length} reservations`);
    
    return reservations;
  }

  // Update reservation
  async updateReservation(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    this.logger.debug('🔄 Updating reservation:', id);
    
    const reservation = await this.reservationModel.findByIdAndUpdate(
      id,
      { ...dto, updatedAt: new Date() },
      { new: true },
    );
    
    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }
    
    this.logger.debug('✅ Reservation updated successfully');
    return reservation;
  }

  // Delete reservation
  async deleteReservation(id: string): Promise<{ message: string }> {
    this.logger.debug('🗑️ Deleting reservation:', id);
    
    const result = await this.reservationModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Reservation not found.');
    }
    
    this.logger.debug('✅ Reservation deleted successfully');
    return { message: 'Reservation deleted successfully' };
  }
}

////////////////////////////////////
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { Reservation, ReservationSchema } from './schema/reservation.schema';
import { Service, ServiceSchema } from '../service/schema/service.schema';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Service.name, schema: ServiceSchema }
    ]),
    AuthModule, // This provides the JWT strategy and PassportModule
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
////////////////////////////////////////////////////:
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  clientName: string;

  @Prop()
  clientPhone?: string;

  // ✅ FIXED: Support both single and multiple services
  @Prop({ type: [Types.ObjectId], required: true, ref: 'Service' })
  serviceIds: Types.ObjectId[];

  // Add service details for easy access (denormalized data)
  @Prop([{
    serviceId: { type: Types.ObjectId, ref: 'Service' },
    serviceName: String,
    duration: Number,
    price: Number
  }])
  services: {
    serviceId: Types.ObjectId;
    serviceName: string;
    duration: number;
    price: number;
  }[];

  @Prop({ required: true })
  barberName: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ 
    required: true, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  })
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @Prop()
  notes?: string;

  // Calculated fields
  @Prop()
  totalDuration?: number;

  @Prop()
  totalPrice?: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
/////////////////////
import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId, IsDateString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  // ✅ CLEAN: Only need service IDs - service details fetched from DB
  @IsOptional()
  @IsMongoId()
  serviceId?: string; // For single service (backward compatibility)

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  serviceIds?: string[]; // For multiple services

  @IsString()
  @IsNotEmpty()
  barberName: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // ✅ REMOVED: No need to pass service names, prices, durations, or status
  // These are automatically handled by the backend
}

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsString()
  barberName?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;
}
import { IsString, IsNumber, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name: string;

  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration: number;

  @IsNumber()
  @Min(0, { message: 'Price must be non-negative' })
  price: number;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price must be non-negative' })
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
  
  ....................;
  import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  name: string; // e.g. "Haircut", "Beard Trim"

  @Prop({ required: true })
  duration: number; // in minutes, e.g. 30, 45, 60

  @Prop({ required: true })
  price: number; // service price

  @Prop({ default: true })
  isActive: boolean; // enable/disable service
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
.....................
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
  } from '@nestjs/common';
  import { ServiceService } from './service.service';
  import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
  
  @Controller('services') 
  export class ServiceController {
    constructor(private readonly serviceService: ServiceService) {}
  
    @Post('create')
    create(@Body() createServiceDto: CreateServiceDto) {
      return this.serviceService.create(createServiceDto);
    }
  
    @Get()
    findAll() {
      return this.serviceService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.serviceService.findOne(id);
    }
  
    @Put(':id')
    update(
      @Param('id') id: string,
      @Body() updateServiceDto: UpdateServiceDto,
    ) {
      return this.serviceService.update(id, updateServiceDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.serviceService.remove(id);
    }
  }
  ........................................;

  import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { Service, ServiceSchema } from './schema/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService], // in case you need it elsewhere
})
export class ServiceModule {}

..............................................................
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from './schema/service.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const createdService = new this.serviceModel(createServiceDto);
    return createdService.save();
  }

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find().exec();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const updatedService = await this.serviceModel.findByIdAndUpdate(
      id,
      updateServiceDto,
      { new: true },
    );
    if (!updatedService) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return updatedService;
  }

  async remove(id: string): Promise<void> {
    const result = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
  }
}

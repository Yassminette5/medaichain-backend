import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicinesController } from './medicines.controller';
import { MedicinesService } from './medicines.service';
import { Medicine, MedicineSchema } from './schemas/medicine.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Medicine.name, schema: MedicineSchema }]),
    ],
    controllers: [MedicinesController],
    providers: [MedicinesService],
    exports: [MedicinesService],
})
export class MedicinesModule { }

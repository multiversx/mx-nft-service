import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/modules/PaginatedType';
import { Asset } from './Asset.dto';

@ObjectType()
export class PaginatedAsset extends Paginated(Asset) {}

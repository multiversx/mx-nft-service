import {InputType,Field} from "@nestjs/graphql";

@InputType()
export class ProcessMarketplaceEventInput{
    @Field(() => String)
    marketplaceAddress: string;

    @Field(() => String)
    eventName: string;
}

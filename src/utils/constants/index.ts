export const NFT_IDENTIFIER_RGX = '^[A-Z0-9]{3,10}-[a-f0-9]{6}-[a-f0-9]{2,}$';
export const NFT_IDENTIFIER_ERROR = 'You should provide a valid nft identifier';
export const COLLECTION_IDENTIFIER_RGX = '^[A-Z0-9]{3,10}-[a-f0-9]{6}$';
export const COLLECTION_IDENTIFIER_ERROR = 'You should provide a valid collection identifier';
export const EGLD_OR_ESDT_TOKEN_RGX = '(EGLD)|(^[A-Z0-9]{3,10}-[a-f0-9]{6}$)';
export const ESDT_TOKEN_ERROR = 'You should provide a valid ESDT token identifier';
export const ADDRESS_RGX = '^erd[a-z0-9]{59,59}$';
export const ADDRESS_ERROR = 'You should provide a valid erd address';
export const NUMERIC_RGX = '^[0-9]*$';
export const NUMERIC_ERROR = 'should contain only numeric characters';

export const MYSQL_ALREADY_EXISTS = 1062;

export const XOXNO_KEY = 'xoxno';
export const XOXNO_MINTING_MANAGER = 'erd1qqqqqqqqqqqqqpgqg9fa0dmpn8fu3fnleeqn5zt8rl8mdqjkys5s2gtas7';
export const DEADRARE_KEY = 'deadrare';
export const ELRONDNFTSWAP_KEY = 'elrondnftswap';
export const ENEFTOR_KEY = 'eneftor';
export const FRAMEIT_KEY = 'frameit';
export const ICI_KEY = 'ici';

export const ELASTIC_TOKENS_INDEX = 'tokens';
export const ELASTIC_NFT_NSFW = 'nft_nsfw_mark';
export const ELASTIC_NFT_RANK_CUSTOM = 'nft_rank_custom';
export const ELASTIC_NFT_RANK_HASH = 'nft_custom_ranks_hash';
export const ELASTIC_NFT_HASRARITY = 'nft_hasRarity';
export const ELASTIC_NFT_SCORE_OPENRARITY = 'nft_score_openRarity';
export const ELASTIC_NFT_RANK_OPENRARITY = 'nft_rank_openRarity';
export const ELASTIC_NFT_SCORE_JACCARD = 'nft_score_jaccardDistances';
export const ELASTIC_NFT_RANK_JACCARD = 'nft_rank_jaccardDistances';
export const ELASTIC_NFT_SCORE_TRAIT = 'nft_score_trait';
export const ELASTIC_NFT_RANK_TRAIT = 'nft_rank_trait';
export const ELASTIC_NFT_SCORE_STATISTICAL = 'nft_score_statistical';
export const ELASTIC_NFT_RANK_STATISTICAL = 'nft_rank_statistical';
export const ELASTIC_NFT_TRAITS = 'nft_traitValues';
export const ELASTIC_NFT_HASTRAITSUMMARY = 'nft_hasTraitSummary';

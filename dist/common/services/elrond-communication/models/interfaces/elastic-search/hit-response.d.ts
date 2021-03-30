export interface HitResponse<T> {
    _index: string;
    _type: string;
    _id: string;
    _score: string;
    _source: T;
}

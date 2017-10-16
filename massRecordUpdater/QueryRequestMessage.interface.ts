export interface IQueryRequestMessage {
    action: string,
    fields: Array<string>,
    table: string,
    clauses: string
}
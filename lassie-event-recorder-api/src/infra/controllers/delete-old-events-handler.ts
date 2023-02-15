import { DeleteOldEvents } from "../../use-cases/delete-old-events";

export class DeleteOldEventsHandler {
  constructor(private useCase: DeleteOldEvents) {}

  public handler = async (event: any): Promise<any> => {
    try {
      await this.useCase.execute();
    } catch(err) {
      console.error("Error while executing delete old events use case.", err);
      throw err;
    }
  }
}
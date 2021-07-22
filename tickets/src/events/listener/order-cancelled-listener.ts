import { Listener, OrderCancelledEvent, Subjects } from '@jbwtickets/common'
import { Message } from 'node-nats-streaming'
import { Ticket } from '../../models/ticket'
import { queueGroupName } from './queue-group-name'
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher'

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled
  queueGroupName = queueGroupName

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    //Find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id)

    // if no ticket throw error
    if (!ticket) {
      throw new Error('Ticket not found')
    }
    // Mark the ticket as being reserved by setting ordre id
    ticket.set({ orderId: undefined })
    // save the ticket
    await ticket.save()
    new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      orderId: ticket.orderId,
      version: ticket.version,
      userId: ticket.userId,
    })

    // ack the message
    msg.ack()
  }
}

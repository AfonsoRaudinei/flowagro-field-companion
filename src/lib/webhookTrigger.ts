import { supabase } from '@/integrations/supabase/client';

export interface WebhookEvent {
  event_type: string;
  data: any;
}

export class WebhookTrigger {
  static async trigger(event: WebhookEvent) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping webhook trigger');
        return;
      }

      console.log(`Triggering webhook event: ${event.event_type}`);

      const { data, error } = await supabase.functions.invoke('webhook-sender', {
        body: {
          user_id: user.id,
          event_type: event.event_type,
          data: event.data
        }
      });

      if (error) {
        console.error('Error triggering webhook:', error);
        return;
      }

      console.log('Webhook triggered successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in webhook trigger:', error);
    }
  }

  // Convenience methods for common events
  static async producerCreated(producer: any) {
    return this.trigger({
      event_type: 'producer.created',
      data: {
        producer: {
          id: producer.id,
          name: producer.name,
          farm_name: producer.farm_name,
          location: producer.location,
          phone: producer.phone,
          email: producer.email,
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  static async conversationStarted(conversation: any, producer: any) {
    return this.trigger({
      event_type: 'conversation.started',
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
        producer: {
          id: producer.id,
          name: producer.name,
          farm_name: producer.farm_name,
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  static async messageReceived(message: any, conversation: any, producer?: any) {
    return this.trigger({
      event_type: 'message.received',
      data: {
        message: {
          id: message.id,
          content: message.content,
          sender_type: message.sender_type,
          message_type: message.message_type,
        },
        conversation: {
          id: conversation.id,
          title: conversation.title,
        },
        producer: producer ? {
          id: producer.id,
          name: producer.name,
          farm_name: producer.farm_name,
        } : null,
        timestamp: new Date().toISOString()
      }
    });
  }

  static async mapAnalyzed(analysis: any) {
    return this.trigger({
      event_type: 'map.analyzed',
      data: {
        analysis: {
          id: analysis.id,
          type: analysis.type,
          results: analysis.results,
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  static async trailCompleted(trail: any) {
    return this.trigger({
      event_type: 'gps.trail_completed',
      data: {
        trail: {
          id: trail.id,
          distance: trail.distance,
          duration: trail.duration,
          points_count: trail.points?.length || 0,
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  static async dataSynced(syncInfo: any) {
    return this.trigger({
      event_type: 'data.synced',
      data: {
        sync: {
          type: syncInfo.type,
          items_count: syncInfo.itemsCount,
          success: syncInfo.success,
        },
        timestamp: new Date().toISOString()
      }
    });
  }
}
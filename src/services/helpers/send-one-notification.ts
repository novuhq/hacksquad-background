import { Novu } from '@novu/node';
import {prisma} from "../database/connection";

const novu = new Novu(process.env.NOVU_API_KEY!);

const sendOneNotification = async (triggerName: string, payload: any, user: {id: string, email: string}) => {
  const findUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  const [firstName, lastName] = findUser?.name?.split(' ') || [];
  return novu.trigger(triggerName, {
    to: [
      {
        subscriberId: user.email,
        email: user.email,
        firstName,
        lastName,
      },
    ],
    payload,
  });
};

export default sendOneNotification;

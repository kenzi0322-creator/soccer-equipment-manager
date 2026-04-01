'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getMembers, saveMembers } from '@/lib/data/db';

export async function updateMemberAction(formData: FormData) {
  const id = formData.get('id') as string;
  const members = await getMembers();
  const index = members.findIndex(m => m.id === id);
  
  if (index === -1) throw new Error('メンバーが見つかりません');

  const existing = members[index];
  
  const updatedMember = {
    ...existing,
    name: formData.get('name') as string,
    uniform_number: formData.get('uniform_number') as string,
    nearest_station: formData.get('nearest_station') as string,
    has_car: formData.get('has_car') === 'on',
    has_black_pants: formData.get('has_black_pants') === 'on',
    has_black_socks: formData.get('has_black_socks') === 'on',
    note: formData.get('note') as string,
  };

  members[index] = updatedMember;
  await saveMembers(members);
  
  revalidatePath('/members');
  redirect('/members');
}

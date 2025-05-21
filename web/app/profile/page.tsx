import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await currentUser();
  
  if (!user) redirect('/sign-in');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Email</h2>
          <p>{user.emailAddresses[0].emailAddress}</p>
        </div>
        <div>
          <h2 className="font-semibold">Name</h2>
          <p>{user.firstName} {user.lastName}</p>
        </div>
        {/* Add more profile fields as needed */}
      </div>
    </div>
  );
}
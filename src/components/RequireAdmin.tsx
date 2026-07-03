if (!isAdmin) {
  console.log("USER NOT ADMIN:", user);
  return <div>NOT ADMIN (DEBUG MODE)</div>;
}
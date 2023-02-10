type MethodReturnType<
  TClass extends new (...args: any) => any,
  Method extends keyof InstanceType<TClass> & string
> = Awaited<ReturnType<InstanceType<TClass>[Method]>>;

export default MethodReturnType;

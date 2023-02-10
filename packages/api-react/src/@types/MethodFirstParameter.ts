type MethodFirstParameter<
  TClass extends new (...args: any) => any,
  Method extends keyof InstanceType<TClass> & string
> = Parameters<InstanceType<TClass>[Method]>[0];

export default MethodFirstParameter;

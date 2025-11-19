declare module 'spel2js' {
  // StandardContext in spel2js exports an object with a create() function
  // but it returns a plain object with authentication/principal properties.
  // It doesn't have setVariable method.
  // The evaluator.eval() takes (context, locals) where locals is where variables go.
  
  export const StandardContext: {
    create(authentication?: any, principal?: any): any;
  }

  export const SpelExpressionEvaluator: {
    compile(expression: string): CompiledExpression;
    eval(expression: string, context?: any, locals?: any): any;
  }

  export interface CompiledExpression {
    eval(context?: any, locals?: any): any;
  }
}

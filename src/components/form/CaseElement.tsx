import * as React from 'react';
import Select from 'react-select';
import { GetOperatorConfig, Operator } from '../../services/EditorConfig';
import { CaseProps } from '../routers/SwitchRouter';
import ComponentMap from '../../services/ComponentMap';
import FormElement from './FormElement';
import TextInputElement, { HTMLTextElement } from './TextInputElement';

const forms = require('./FormElement.scss');
const styles = require('./CaseElement.scss');

export interface CaseElementProps extends CaseProps {
    name: string; // satisfy form widget props
    operatorConfigList: Operator[];
    getOperatorConfig: GetOperatorConfig;
    onRemove(c: CaseElement): void;
    ComponentMap: ComponentMap;
}

interface CaseElementState {
    errors: string[];
    operator: string;
    arguments: string[];
    exitName: string;
}

export default class CaseElement extends React.Component<CaseElementProps, CaseElementState> {
    private category: TextInputElement;
    private operatorConfig: Operator;

    constructor(props: CaseElementProps) {
        super(props);

        this.state = {
            errors: [],
            operator: this.props.kase.type,
            arguments: this.props.kase.arguments,
            exitName: this.props.exitName ? this.props.exitName : ''
        };

        this.operatorConfig = this.props.getOperatorConfig(this.props.kase.type);

        this.hasArguments = this.hasArguments.bind(this);
        this.onChangeArguments = this.onChangeArguments.bind(this);
        this.onChangeOperator = this.onChangeOperator.bind(this);
        this.onChangeExitName = this.onChangeExitName.bind(this);
        this.onRemove = this.onRemove.bind(this);
    }

    private generateExitNameFromArguments(args: string[]): string {
        let prefix = '';

        if (this.state.operator.indexOf('_lt') > -1) {
            if (this.state.operator.indexOf('date') > -1) {
                prefix = 'Before ';
            } else {
                if (this.state.operator.indexOf('lte') > -1) {
                    prefix = '<= ';
                } else {
                    prefix = '< ';
                }
            }
        } else if (this.state.operator.indexOf('_gt') > -1) {
            if (this.state.operator.indexOf('date') > -1) {
                prefix = 'After ';
            } else {
                if (this.state.operator.indexOf('gte') > -1) {
                    prefix = '>= ';
                } else {
                    prefix = '>';
                }
            }
        }

        if (args && args.length > 0) {
            const [firstArg] = args;
            const words = firstArg.match(/\w+/g);

            if (words && words.length > 0) {
                const [firstWord] = words;
                return prefix + firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
            }
            return prefix + firstArg.charAt(0).toUpperCase() + firstArg.slice(1);
        }
        return null;
    }

    private getExitName(args: string[] = null) {
        let exitName = this.state.exitName;

        if (!args) {
            /** If the category name is specified for our operator, use that */
            if (this.operatorConfig.categoryName) {
                ({ categoryName: exitName } = this.operatorConfig);
            }
        } else {
            if (
                !exitName ||
                exitName === this.generateExitNameFromArguments(this.props.kase.arguments)
            ) {
                exitName = this.generateExitNameFromArguments(args);
            }
        }

        return exitName;
    }

    private onChangeOperator(val: Operator) {
        this.operatorConfig = val;

        this.setState(
            {
                operator: val.type,
                exitName: this.getExitName()
            },
            () => this.props.onChanged(this)
        );
    }

    private onChangeArguments(val: React.ChangeEvent<HTMLTextElement>) {
        const args = [val.target.value];
        const exitName = this.getExitName(args);

        this.setState(
            {
                arguments: args,
                exitName
            },
            () => {
                this.props.onChanged(this);
            }
        );

        this.category.setState({ value: exitName });
    }

    private onChangeExitName(val: React.ChangeEvent<HTMLTextElement>) {
        this.setState(
            {
                exitName: val.target.value
            },
            () => this.props.onChanged(this)
        );
    }

    private onRemove(ele: any) {
        this.props.onRemove(this);
    }

    hasArguments(): boolean {
        return (
            this.state.arguments &&
            this.state.arguments.length > 0 &&
            this.state.arguments[0].trim().length > 0
        );
    }

    validate(): boolean {
        const errors: string[] = [];

        if (this.operatorConfig.operands === 0) {
            if (this.state.exitName.trim().length === 0) {
                const { verboseName } = this.operatorConfig;
                errors.push(`A category name is required when using "${verboseName}"`);
            }
        } else {
            /** Check our argument list */
            /** If we have arguments, we need an exit name */
            if (this.hasArguments()) {
                if (!this.category || !this.category.state.value) {
                    errors.push('A category name is required');
                }
            }

            /** If we have an exit name we need arguments */
            if (this.state.exitName) {
                if (!this.hasArguments()) {
                    const operator = this.props.getOperatorConfig(this.state.operator);
                    const { verboseName } = operator;
                    errors.push(`When using "${verboseName}", an argument is required.`);
                }
            }

            /** Validate numeric and date operators */
            if (this.hasArguments() && this.state.arguments[0].trim().indexOf('@') !== 0) {
                if (this.state.operator.indexOf('number') > -1) {
                    if (this.state.arguments[0]) {
                        if (isNaN(parseInt(this.state.arguments[0]))) {
                            errors.push('Enter a number when using numeric rules.');
                        }
                    }
                }

                if (this.state.operator.indexOf('date') > -1) {
                    if (this.state.arguments[0]) {
                        if (isNaN(Date.parse(this.state.arguments[0]))) {
                            errors.push('Enter a date when using date rules (e.g. 1/1/2017).');
                        }
                    }
                }
            }
        }

        if (this.state.errors.length === 0 && errors.length === 0) {
            return true;
        }

        this.setState({ errors });

        return errors.length === 0;
    }

    render() {
        const classes = [styles.case];

        if (this.state.errors.length > 0) {
            classes.push(forms.invalid);
        }

        const value = this.state.arguments ? this.state.arguments[0] : '';

        let args: JSX.Element = null;

        if (this.operatorConfig && this.operatorConfig.operands === 1) {
            args = (
                <TextInputElement
                    className={styles.input}
                    name="arguments"
                    onChange={this.onChangeArguments}
                    value={value}
                    autocomplete
                    ComponentMap={this.props.ComponentMap}
                />
            );
        }

        const options = this.props.operatorConfigList;

        return (
            <FormElement name={this.props.name} errors={this.state.errors} className={styles.group}>
                <div className={`${styles.case} select-medium`}>
                    <div className={styles.choice}>
                        <Select
                            name="operator"
                            clearable={false}
                            options={options}
                            value={this.state.operator}
                            valueKey="type"
                            labelKey="verboseName"
                            optionClassName="operator"
                            searchable={false}
                            onChange={this.onChangeOperator}
                        />
                    </div>
                    <div className={styles.operand}>{args}</div>
                    <div className={styles['categorize-as']}>categorize as</div>
                    <div className={styles.category}>
                        <TextInputElement
                            ref={ele => (this.category = ele)}
                            className={styles.input}
                            name="exitName"
                            onChange={this.onChangeExitName}
                            value={this.state.exitName}
                            ComponentMap={this.props.ComponentMap}
                        />
                    </div>
                    <div className={styles['remove-button']} onClick={this.onRemove}>
                        <span className="icon-remove" />
                    </div>
                </div>
            </FormElement>
        );
    }
}

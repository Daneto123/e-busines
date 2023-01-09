export class ReqInfoModel
{
	phoneModule!: string;
	width!: string;
	height!: string;
	thickness!: string;
	color!: string;
	email!: string;
	moreInfo!: string;

	constructor(obj: any = null)
	{
		if(obj != null)
		{
			Object.assign(this, obj);
		}
	}
}
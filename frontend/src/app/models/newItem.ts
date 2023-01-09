export class ItemInfoModel
{
	company_name!: string;
	width!: string;
	height!: string;
	thickness!: string;
	color!: string;
	company!: string;
	availability!: string;
	price!: string;

	constructor(obj: any = null)
	{
		if(obj != null)
		{
			Object.assign(this, obj);
		}
	}
}
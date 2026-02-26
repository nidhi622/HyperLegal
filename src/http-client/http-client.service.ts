import {HttpService} from '@nestjs/axios'
import {Injectable} from '@nestjs/common'
import {AxiosError, AxiosRequestConfig, AxiosResponse} from 'axios'
import {Observable, catchError, firstValueFrom} from 'rxjs'

@Injectable()
export class HttpClientService {
	constructor(private http: HttpService) {}

	get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T, any>> {
		return firstValueFrom(this.http.get<T>(url, config).pipe(catchError(this.handleError)))
	}

	async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T, any>> {
		return firstValueFrom(this.http.post<T>(url, data, config).pipe(catchError(this.handleError)))
	}

	private handleError(err: AxiosError): Observable<never> {
		
		throw err
	}
}

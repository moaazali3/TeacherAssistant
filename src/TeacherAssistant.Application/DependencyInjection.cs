using Microsoft.Extensions.DependencyInjection;

namespace TeacherAssistant.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // TODO: Register Application services, MediatR, FluentValidation, or AutoMapper if added
        return services;
    }
}
